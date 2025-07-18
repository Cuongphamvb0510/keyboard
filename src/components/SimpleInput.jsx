import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import './SimpleInput.css';

const SimpleInput = forwardRef(({ value, onChange, placeholder, onFocus, onBlur }, ref) => {
  const inputRef = useRef(null);
  const [showCursor, setShowCursor] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useImperativeHandle(ref, () => ({
    insertTextAtCursor: (text) => {
      const input = inputRef.current;
      if (!input) return;

      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = value.substring(0, start) + text + value.substring(end);
      
      onChange(newValue);
      
      setTimeout(() => {
        const newPos = start + text.length;
        input.setSelectionRange(newPos, newPos);
        setCursorPosition(newPos);
      }, 0);
    },
    
    deleteAtCursor: () => {
      const input = inputRef.current;
      if (!input) return;

      const start = input.selectionStart;
      const end = input.selectionEnd;
      
      let newValue;
      let newPos;
      
      if (start !== end) {
        newValue = value.substring(0, start) + value.substring(end);
        newPos = start;
      } else if (start > 0) {
        newValue = value.substring(0, start - 1) + value.substring(start);
        newPos = start - 1;
      } else {
        return;
      }
      
      onChange(newValue);
      
      setTimeout(() => {
        input.setSelectionRange(newPos, newPos);
        setCursorPosition(newPos);
      }, 0);
    },
    
    getCursorPosition: () => {
      return inputRef.current?.selectionStart || 0;
    },
    
    setCursorPosition: (pos) => {
      const input = inputRef.current;
      if (!input) return;
      
      const clampedPos = Math.max(0, Math.min(pos, value.length));
      input.setSelectionRange(clampedPos, clampedPos);
      setCursorPosition(clampedPos);
      
      // Auto scroll to cursor
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const computedStyle = window.getComputedStyle(input);
        
        context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        const textBeforeCursor = value.substring(0, clampedPos);
        const textWidth = context.measureText(textBeforeCursor).width;
        
        const inputWidth = input.offsetWidth;
        input.scrollLeft = Math.max(0, textWidth - inputWidth + 40);
      }, 0);
    },
    
    focus: () => {
      inputRef.current?.focus();
    },
    
    getInputElement: () => {
      return inputRef.current;
    }
  }));

  useEffect(() => {
    const handleSelectionChange = () => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleFocus = (e) => {
    setShowCursor(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setShowCursor(false);
    if (onBlur) onBlur(e);
  };

  const handleClick = () => {
    if (inputRef.current) {
      setTimeout(() => {
        setCursorPosition(inputRef.current.selectionStart);
      }, 0);
    }
  };

  // Calculate cursor position relative to visible text
  const getCursorLeftPosition = () => {
    if (!inputRef.current || !value) return 8;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const computedStyle = window.getComputedStyle(inputRef.current);
    
    context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textWidth = context.measureText(textBeforeCursor).width;
    
    // Trừ đi scrollLeft để tính vị trí cursor tương đối với phần hiển thị
    const scrollLeft = inputRef.current.scrollLeft || 0;
    return 8 + textWidth - scrollLeft;
  };

  // Auto scroll to cursor when text is long
  useEffect(() => {
    if (inputRef.current && showCursor) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const computedStyle = window.getComputedStyle(inputRef.current);
      
      context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const textWidth = context.measureText(textBeforeCursor).width;
      
      const inputWidth = inputRef.current.offsetWidth;
      // Scroll để cursor luôn ở cuối input với padding 20px
      inputRef.current.scrollLeft = Math.max(0, textWidth - inputWidth + 40);
    }
  }, [cursorPosition, showCursor, value]);

  return (
    <div className="simple-input-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        readOnly={isMobile}
        className="simple-input"
      />
      {showCursor && isMobile && (
        <div 
          className="custom-cursor" 
          style={{ left: `${getCursorLeftPosition()}px` }}
        />
      )}
    </div>
  );
});

SimpleInput.displayName = 'SimpleInput';

export default SimpleInput; 