import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import './CustomInput.css';

const CustomInput = forwardRef(({ onFocus, value, onChange, placeholder, isKeyboardVisible }, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [, forceUpdate] = useState({});
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const textRef = useRef(null);
  const cursorPositionRef = useRef(0);
  const isSelectingRef = useRef(false);
  const startPosRef = useRef(null);
  const lastTapTimeRef = useRef(0);
  const lastTapPosRef = useRef(null);

  // Force re-render khi cần update UI
  const updateCursorPosition = (newPos) => {
    cursorPositionRef.current = newPos;
    // Clear selection khi di chuyển cursor
    if (!isSelectingRef.current) {
      setSelectionStart(null);
      setSelectionEnd(null);
    }
    forceUpdate({});
  };

  // Update selection
  const updateSelection = (start, end) => {
    setSelectionStart(Math.min(start, end));
    setSelectionEnd(Math.max(start, end));
    cursorPositionRef.current = end;
    forceUpdate({});
  };

  // Handle copy
  const handleCopy = async () => {
    if (selectionStart !== null && selectionEnd !== null && value) {
      const selectedText = value.substring(selectionStart, selectionEnd);
      
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(selectedText);
          console.log('Copied using clipboard API:', selectedText);
        } else {
          // Fallback for older browsers/mobile
          const textArea = document.createElement('textarea');
          textArea.value = selectedText;
          textArea.style.position = 'fixed';
          textArea.style.top = '0';
          textArea.style.left = '0';
          textArea.style.width = '2em';
          textArea.style.height = '2em';
          textArea.style.padding = '0';
          textArea.style.border = 'none';
          textArea.style.outline = 'none';
          textArea.style.boxShadow = 'none';
          textArea.style.background = 'transparent';
          
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            const successful = document.execCommand('copy');
            console.log('Fallback copy ' + (successful ? 'successful' : 'failed'));
          } catch (err) {
            console.error('Fallback copy error:', err);
          }
          
          document.body.removeChild(textArea);
        }
        
        // Visual feedback
        setShowContextMenu(false);
        
        // Keep selection visible for a moment
        setTimeout(() => {
          setSelectionStart(null);
          setSelectionEnd(null);
        }, 200);
        
      } catch (err) {
        console.error('Copy failed:', err);
        alert('Copy failed. Please try again.');
      }
    }
  };

  // Handle cut
  const handleCut = async () => {
    if (selectionStart !== null && selectionEnd !== null && value) {
      const selectedText = value.substring(selectionStart, selectionEnd);
      
      try {
        // Copy to clipboard first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(selectedText);
        } else {
          // Fallback
          const textArea = document.createElement('textarea');
          textArea.value = selectedText;
          textArea.style.position = 'fixed';
          textArea.style.top = '0';
          textArea.style.left = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
          } catch (err) {
            console.error('Fallback cut copy error:', err);
          }
          
          document.body.removeChild(textArea);
        }
        
        // Delete selected text
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const newValue = before + after;
        
        onChange({ target: { value: newValue } });
        updateCursorPosition(selectionStart);
        setSelectionStart(null);
        setSelectionEnd(null);
        setShowContextMenu(false);
        
        console.log('Cut successful');
      } catch (err) {
        console.error('Cut failed:', err);
        alert('Cut failed. Please try again.');
      }
    }
  };

  // Handle paste
  const handlePaste = async () => {
    try {
      let pastedText = '';
      
      // Try modern clipboard API
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          pastedText = await navigator.clipboard.readText();
          console.log('Pasted using clipboard API:', pastedText);
        } catch (err) {
          console.error('Clipboard API failed:', err);
          
          // Try fallback
          const result = await tryFallbackPaste();
          if (result) pastedText = result;
        }
      } else {
        // Direct fallback for older browsers
        const result = await tryFallbackPaste();
        if (result) pastedText = result;
      }
      
      if (pastedText) {
        const pos = cursorPositionRef.current;
        let newValue;
        let newPos;
        
        if (selectionStart !== null && selectionEnd !== null) {
          // Replace selection
          const before = value ? value.substring(0, selectionStart) : '';
          const after = value ? value.substring(selectionEnd) : '';
          newValue = before + pastedText + after;
          newPos = selectionStart + pastedText.length;
          setSelectionStart(null);
          setSelectionEnd(null);
        } else {
          // Insert at cursor
          const before = value ? value.substring(0, pos) : '';
          const after = value ? value.substring(pos) : '';
          newValue = before + pastedText + after;
          newPos = pos + pastedText.length;
        }
        
        onChange({ target: { value: newValue } });
        updateCursorPosition(newPos);
        setShowContextMenu(false);
        
        console.log('Paste successful');
      }
    } catch (err) {
      console.error('Paste failed:', err);
      alert('Paste failed. Please try using Ctrl/Cmd+V instead.');
    }
  };

  // Fallback paste method
  const tryFallbackPaste = () => {
    return new Promise((resolve) => {
      const textArea = document.createElement('textarea');
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      textArea.focus();
      
      // Give browser time to paste
      setTimeout(() => {
        try {
          // Try paste command
          document.execCommand('paste');
          const pastedText = textArea.value;
          document.body.removeChild(textArea);
          
          if (pastedText) {
            console.log('Fallback paste successful:', pastedText);
            resolve(pastedText);
          } else {
            console.log('Fallback paste: no text');
            resolve('');
          }
        } catch (err) {
          console.error('Fallback paste error:', err);
          document.body.removeChild(textArea);
          resolve('');
        }
      }, 100);
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (value) {
      setSelectionStart(0);
      setSelectionEnd(value.length);
      cursorPositionRef.current = value.length;
      setShowContextMenu(true);
      
      const rect = textRef.current.getBoundingClientRect();
      setContextMenuPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 60
      });
      forceUpdate({});
    }
  };

  // Expose methods để parent component có thể gọi
  useImperativeHandle(ref, () => ({
    getCursorPosition: () => cursorPositionRef.current,
    setCursorPosition: (pos) => {
      updateCursorPosition(pos)
      
      // Sync với hidden input
      if (hiddenInputRef.current) {
        hiddenInputRef.current.setSelectionRange(pos, pos)
      }
    },
    insertTextAtCursor: (text) => {
      const pos = cursorPositionRef.current;
      
      let newValue;
      let newPos;
      
      // Nếu có text được select, replace nó
      if (selectionStart !== null && selectionEnd !== null) {
        const before = value ? value.substring(0, selectionStart) : '';
        const after = value ? value.substring(selectionEnd) : '';
        newValue = before + text + after;
        newPos = selectionStart + text.length;
        setSelectionStart(null);
        setSelectionEnd(null);
      } else {
        // Insert bình thường
        const before = value ? value.substring(0, pos) : '';
        const after = value ? value.substring(pos) : '';
        newValue = before + text + after;
        newPos = pos + text.length;
      }
      
      // Update value
      onChange({ target: { value: newValue } });
      
      // Update cursor position ngay lập tức
      updateCursorPosition(newPos);
      
      // Đảm bảo hidden input có focus và selection đúng
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = newValue;
        hiddenInputRef.current.focus();
        hiddenInputRef.current.setSelectionRange(newPos, newPos);
      }
    },
    deleteAtCursor: () => {
      const pos = cursorPositionRef.current;
      
      let newValue;
      let newPos;
      
      // Nếu có text được select, xóa nó
      if (selectionStart !== null && selectionEnd !== null) {
        const before = value ? value.substring(0, selectionStart) : '';
        const after = value ? value.substring(selectionEnd) : '';
        newValue = before + after;
        newPos = selectionStart;
        setSelectionStart(null);
        setSelectionEnd(null);
      } else if (pos > 0 && value) {
        // Xóa bình thường
        const before = value.substring(0, pos - 1);
        const after = value.substring(pos);
        newValue = before + after;
        newPos = pos - 1;
      } else {
        return;
      }
      
      onChange({ target: { value: newValue } });
      updateCursorPosition(newPos);
      
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = newValue;
        hiddenInputRef.current.focus();
        hiddenInputRef.current.setSelectionRange(newPos, newPos);
      }
    }
  }));

  // Update cursor position nếu value length thay đổi (khi xóa hết text)
  useEffect(() => {
    if (!value || value.length === 0) {
      updateCursorPosition(0);
    } else if (cursorPositionRef.current > value.length) {
      updateCursorPosition(value.length);
    }
  }, [value]);

  // Ẩn cursor khi keyboard hiện nhưng không focus input
  useEffect(() => {
    if (isKeyboardVisible && !document.activeElement?.closest('.custom-input')) {
      setIsFocused(false);
    }
  }, [isKeyboardVisible]);

  const handleFocus = () => {
    setIsFocused(true);
    // Chỉ set cursor position về cuối nếu chưa có cursor position
    if (cursorPositionRef.current === 0 && value) {
      updateCursorPosition(value.length);
    }
    onFocus && onFocus();
  };

  const calculateCursorPosition = (e) => {
    if (!textRef.current) {
      updateCursorPosition(0);
      return 0;
    }

    if (!value) {
      updateCursorPosition(0);
      return 0;
    }

    const rect = textRef.current.getBoundingClientRect();
    // Lấy tọa độ x từ mouse hoặc touch event
    let clientX;
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const x = clientX - rect.left;
    
    // Check if clicked beyond text
    const textWidth = textRef.current.scrollWidth;
    if (x > textWidth) {
      const position = value.length;
      if (!isSelectingRef.current) {
        updateCursorPosition(position);
      }
      return position;
    }
    
    // Tạo một element tạm để đo độ rộng text
    const measurer = document.createElement('span');
    measurer.style.visibility = 'hidden';
    measurer.style.position = 'absolute';
    measurer.style.font = window.getComputedStyle(textRef.current).font;
    measurer.style.whiteSpace = 'pre';
    document.body.appendChild(measurer);

    let position = 0;
    let minDistance = Infinity;

    // Tìm vị trí gần nhất với click
    for (let i = 0; i <= value.length; i++) {
      measurer.textContent = value.substring(0, i);
      const width = measurer.offsetWidth;
      const distance = Math.abs(width - x);
      
      if (distance < minDistance) {
        minDistance = distance;
        position = i;
      }
    }

    document.body.removeChild(measurer);
    
    if (!isSelectingRef.current) {
      updateCursorPosition(position);
    }
    
    return position;
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.custom-input')) {
      e.preventDefault();
      
      // Check if clicking on selected text
      if (selectionStart !== null && selectionEnd !== null) {
        const pos = calculateCursorPosition(e);
        if (pos >= selectionStart && pos <= selectionEnd) {
          // Clicking on selection - show menu
          const rect = textRef.current.getBoundingClientRect();
          setContextMenuPos({
            x: rect.left + rect.width / 2,
            y: rect.top - 60
          });
          setShowContextMenu(true);
          return;
        }
      }
      
      // Bắt đầu selection
      const pos = calculateCursorPosition(e);
      startPosRef.current = pos;
      isSelectingRef.current = false;
      
      // Clear selection cũ và hide menu
      setSelectionStart(null);
      setSelectionEnd(null);
      setShowContextMenu(false);
    }
  };

  const handleMouseMove = (e) => {
    if (startPosRef.current !== null && e.buttons === 1) {
      e.preventDefault();
      isSelectingRef.current = true;
      
      const currentPos = calculateCursorPosition(e);
      updateSelection(startPosRef.current, currentPos);
      setShowContextMenu(false); // Hide menu while selecting
    }
  };

  const handleMouseUp = () => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      
      // Show menu after selection if text is selected
      if (selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
        setTimeout(() => {
          const rect = textRef.current.getBoundingClientRect();
          const startPos = getSelectionHandlePosition(selectionStart, false);
          const endPos = getSelectionHandlePosition(selectionEnd, true);
          const centerX = (startPos.left + endPos.left) / 2;
          
          setContextMenuPos({
            x: centerX,
            y: rect.top - 60
          });
          setShowContextMenu(true);
        }, 100); // Small delay for better UX
      }
    }
    startPosRef.current = null;
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentTime = Date.now();
    
    // Check for triple tap (select all)
    if (lastTapTimeRef.current && 
        currentTime - lastTapTimeRef.current < 300) {
      
      if (lastTapPosRef.current && 
          currentTime - lastTapPosRef.current < 600) {
        // Triple tap - select all
        if (value) {
          setSelectionStart(0);
          setSelectionEnd(value.length);
          cursorPositionRef.current = value.length;
          setShowContextMenu(true);
          
          const rect = textRef.current.getBoundingClientRect();
          setContextMenuPos({
            x: rect.left + rect.width / 2,
            y: rect.top - 60
          });
          forceUpdate({});
        }
        lastTapTimeRef.current = 0;
        lastTapPosRef.current = 0;
        return;
      }
      
      // Double tap - select word
      const tapPos = calculateCursorPosition(e);
      if (value && tapPos >= 0 && tapPos <= value.length) {
        // Check if clicking on a character, not empty space
        const charAtPos = value[tapPos] || value[tapPos - 1];
        
        if (charAtPos && charAtPos !== ' ') {
          let start = tapPos;
          let end = tapPos;
          
          // If we clicked at the end of a word, adjust position
          if (!value[tapPos] || value[tapPos] === ' ') {
            start = tapPos - 1;
            end = tapPos - 1;
          }
          
          // Find word boundaries
          while (start > 0 && value[start - 1] !== ' ') start--;
          while (end < value.length && value[end] !== ' ') end++;
          
          if (start < end) {
            setSelectionStart(start);
            setSelectionEnd(end);
            cursorPositionRef.current = end;
            
            const rect = textRef.current.getBoundingClientRect();
            setContextMenuPos({
              x: rect.left + rect.width / 2,
              y: rect.top - 60
            });
            setShowContextMenu(true);
            forceUpdate({});
          }
        } else {
          // Clicked on empty space - just move cursor
          updateCursorPosition(tapPos);
        }
      }
      
      lastTapPosRef.current = currentTime;
    } else {
      // Single tap
      lastTapTimeRef.current = currentTime;
      lastTapPosRef.current = 0;
      
      // Just move cursor
      const tapPos = calculateCursorPosition(e);
      updateCursorPosition(tapPos);
      
      // Clear selection
      setSelectionStart(null);
      setSelectionEnd(null);
      setShowContextMenu(false);
      
      // Set focus
      if (!isFocused) {
        handleFocus();
      }
    }
  };

  // Xử lý phím mũi tên
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFocused) return;

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectionStart !== null && selectionEnd !== null && value) {
          const selectedText = value.substring(selectionStart, selectionEnd);
          navigator.clipboard.writeText(selectedText);
        }
        return;
      }

      // Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        if (selectionStart !== null && selectionEnd !== null && value) {
          const selectedText = value.substring(selectionStart, selectionEnd);
          navigator.clipboard.writeText(selectedText);
          
          // Delete selected text
          const before = value.substring(0, selectionStart);
          const after = value.substring(selectionEnd);
          const newValue = before + after;
          
          onChange({ target: { value: newValue } });
          updateCursorPosition(selectionStart);
          setSelectionStart(null);
          setSelectionEnd(null);
          
          if (hiddenInputRef.current) {
            hiddenInputRef.current.value = newValue;
            hiddenInputRef.current.setSelectionRange(selectionStart, selectionStart);
          }
        }
        return;
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then(text => {
          // Insert text at cursor hoặc replace selection
          const pos = cursorPositionRef.current;
          let newValue;
          let newPos;
          
          if (selectionStart !== null && selectionEnd !== null) {
            const before = value ? value.substring(0, selectionStart) : '';
            const after = value ? value.substring(selectionEnd) : '';
            newValue = before + text + after;
            newPos = selectionStart + text.length;
            setSelectionStart(null);
            setSelectionEnd(null);
          } else {
            const before = value ? value.substring(0, pos) : '';
            const after = value ? value.substring(pos) : '';
            newValue = before + text + after;
            newPos = pos + text.length;
          }
          
          onChange({ target: { value: newValue } });
          updateCursorPosition(newPos);
          
          if (hiddenInputRef.current) {
            hiddenInputRef.current.value = newValue;
            hiddenInputRef.current.focus();
            hiddenInputRef.current.setSelectionRange(newPos, newPos);
          }
        });
        return;
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (value) {
          setSelectionStart(0);
          setSelectionEnd(value.length);
          cursorPositionRef.current = value.length;
          forceUpdate({});
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          // Selection với shift
          if (startPosRef.current === null) {
            startPosRef.current = cursorPositionRef.current;
          }
          const newPos = Math.max(0, cursorPositionRef.current - 1);
          updateSelection(startPosRef.current, newPos);
        } else {
          // Clear selection và di chuyển cursor
          startPosRef.current = null;
          updateCursorPosition(Math.max(0, cursorPositionRef.current - 1));
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          // Selection với shift
          if (startPosRef.current === null) {
            startPosRef.current = cursorPositionRef.current;
          }
          const newPos = Math.min(value ? value.length : 0, cursorPositionRef.current + 1);
          updateSelection(startPosRef.current, newPos);
        } else {
          // Clear selection và di chuyển cursor
          startPosRef.current = null;
          updateCursorPosition(Math.min(value ? value.length : 0, cursorPositionRef.current + 1));
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (e.shiftKey) {
          if (startPosRef.current === null) {
            startPosRef.current = cursorPositionRef.current;
          }
          updateSelection(startPosRef.current, 0);
        } else {
          startPosRef.current = null;
          updateCursorPosition(0);
        }
      } else if (e.key === 'End') {
        e.preventDefault();
        if (e.shiftKey) {
          if (startPosRef.current === null) {
            startPosRef.current = cursorPositionRef.current;
          }
          updateSelection(startPosRef.current, value ? value.length : 0);
        } else {
          startPosRef.current = null;
          updateCursorPosition(value ? value.length : 0);
        }
      }
      
      // Clear selection khi nhập ký tự thường
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        startPosRef.current = null;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, value, selectionStart, selectionEnd, onChange]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.context-menu') && !e.target.closest('.custom-input')) {
        setShowContextMenu(false);
      }
    };
    
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showContextMenu]);

  // Handle blur when keyboard is hidden
  useEffect(() => {
    if (!isKeyboardVisible && isFocused) {
      setIsFocused(false);
    }
  }, [isKeyboardVisible, isFocused]);

  const cursorPos = cursorPositionRef.current;

  // Render text với selection
  const renderTextWithSelection = () => {
    if (!value) return null;
    
    if (selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
      // Có selection
      return (
        <>
          <span>{value.substring(0, selectionStart)}</span>
          <span className="selected">{value.substring(selectionStart, selectionEnd)}</span>
          <span>{value.substring(selectionEnd)}</span>
          {isFocused && selectionEnd === cursorPos && <span className="cursor blinking">|</span>}
        </>
      );
    } else {
      // Không có selection
      return (
        <>
          <span>{value.substring(0, cursorPos)}</span>
          {isFocused && <span className="cursor blinking">|</span>}
          <span>{value.substring(cursorPos)}</span>
        </>
      );
    }
  };

  // Calculate position for selection handles
  const getSelectionHandlePosition = (position, isEnd = false) => {
    if (!textRef.current || !value) return { left: 0, top: 0 };
    
    const measurer = document.createElement('span');
    measurer.style.visibility = 'hidden';
    measurer.style.position = 'absolute';
    measurer.style.font = window.getComputedStyle(textRef.current).font;
    measurer.style.whiteSpace = 'pre';
    measurer.textContent = value.substring(0, position);
    document.body.appendChild(measurer);
    
    const width = measurer.offsetWidth;
    document.body.removeChild(measurer);
    
    const rect = textRef.current.getBoundingClientRect();
    return {
      left: rect.left + width,
      top: isEnd ? rect.bottom : rect.top
    };
  };

  // Handle selection handle drag
  const handleSelectionHandleDrag = (e, isEnd) => {
    e.preventDefault();
    e.stopPropagation();
    
    const handleMove = (moveEvent) => {
      const pos = calculateCursorPosition(moveEvent);
      if (isEnd) {
        updateSelection(selectionStart, pos);
      } else {
        updateSelection(pos, selectionEnd);
      }
    };
    
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchend', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchend', handleUp);
  };

  return (
    <>
      <div 
        className={`custom-input ${isFocused ? 'focused' : ''}`}
        onClick={handleClick}
        onTouchStart={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={inputRef}
        tabIndex={0}
        role="textbox"
        aria-label={placeholder}
      >
        <div className="input-content" ref={textRef}>
          {value ? (
            renderTextWithSelection()
          ) : (
            <>
              {!isFocused && placeholder && (
                <span className="placeholder">{placeholder}</span>
              )}
              {isFocused && <span className="cursor blinking">|</span>}
            </>
          )}
        </div>
      </div>
      
      {/* Selection Handles */}
      {selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd && (
        <>
          <div 
            className="selection-handle start"
            style={{
              position: 'fixed',
              ...getSelectionHandlePosition(selectionStart, false),
              transform: 'translate(-50%, -100%)'
            }}
            onMouseDown={(e) => handleSelectionHandleDrag(e, false)}
            onTouchStart={(e) => handleSelectionHandleDrag(e, false)}
          />
          <div 
            className="selection-handle end"
            style={{
              position: 'fixed',
              ...getSelectionHandlePosition(selectionEnd, true),
              transform: 'translate(-50%, 0)'
            }}
            onMouseDown={(e) => handleSelectionHandleDrag(e, true)}
            onTouchStart={(e) => handleSelectionHandleDrag(e, true)}
          />
        </>
      )}
      
      {/* Context Menu - iOS style popup */}
      {showContextMenu && (
        <div 
          className="context-menu" 
          style={{ 
            position: 'fixed', 
            left: contextMenuPos.x + 'px', 
            top: contextMenuPos.y + 'px',
            transform: 'translateX(-50%)'
          }}
        >
          {selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd ? (
            <>
              <button onClick={handleCut}>Cut</button>
              <button onClick={handleCopy}>Copy</button>
              <button onClick={handlePaste}>Paste</button>
            </>
          ) : (
            <>
              <button onClick={handleSelectAll}>Select All</button>
              <button onClick={handlePaste}>Paste</button>
            </>
          )}
        </div>
      )}
    </>
  );
});

CustomInput.displayName = 'CustomInput';

export default CustomInput; 