import { useState, useEffect, useRef } from 'react';
import './VirtualKeyboard.css';

const VirtualKeyboard = ({ onKeyPress, onBackspace, onSpace, onEnter, isVisible, onCursorMove, onLanguageChange }) => {
  const [isShift, setIsShift] = useState(false);
  const [isNumbers, setIsNumbers] = useState(false);
  const [pressedKey, setPressedKey] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [spaceStartX, setSpaceStartX] = useState(null);
  const [cursorMoveMode, setCursorMoveMode] = useState(false);
  const [isVietnamese, setIsVietnamese] = useState(false);
  const spaceLongPressTimer = useRef(null);
  const backspaceLongPressTimer = useRef(null);
  const backspaceIntervalTimer = useRef(null);
  const backspaceAccelerationTimer = useRef(null);

  useEffect(() => {
    // Detect if device supports touch
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Cleanup timers on unmount
    return () => {
      if (backspaceLongPressTimer.current) clearTimeout(backspaceLongPressTimer.current);
      if (backspaceIntervalTimer.current) clearInterval(backspaceIntervalTimer.current);
      if (backspaceAccelerationTimer.current) clearTimeout(backspaceAccelerationTimer.current);
    };
  }, []);

  const lettersLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['123', 'lang', 'space', 'return']
  ];

  const numbersLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    ['#+=', '.', ',', '?', '!', "'", 'backspace'],
    ['ABC', 'lang', 'space', 'return']
  ];

  const symbolsLayout = [
    ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
    ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
    ['123', '.', ',', '?', '!', "'", 'backspace'],
    ['ABC', 'lang', 'space', 'return']
  ];

  const currentLayout = isNumbers ? 
    (isShift ? symbolsLayout : numbersLayout) : 
    lettersLayout;

  const handleKeyPress = (key) => {
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 100);

    let char;
    switch (key) {
      case 'shift':
        setIsShift(!isShift);
        break;
      case '123':
        setIsNumbers(true);
        setIsShift(false);
        break;
      case 'ABC':
        setIsNumbers(false);
        setIsShift(false);
        break;
      case '#+=':
        setIsShift(true);
        break;
      case 'backspace':
        onBackspace();
        break;
      case 'space':
        onSpace();
        break;
      case 'return':
        onEnter();
        break;
      case 'lang':
        setIsVietnamese(!isVietnamese);
        if (onLanguageChange) {
          onLanguageChange(!isVietnamese);
        }
        break;
      default:
        char = isShift && !isNumbers ? key.toUpperCase() : key;
        
        // Nếu là tiếng Việt, có thể thêm dấu thanh
        if (isVietnamese && !isNumbers) {
          // Có thể mở rộng thêm logic cho tiếng Việt ở đây
          // Hiện tại chỉ hiển thị trạng thái VI/EN
        }
        
        onKeyPress && onKeyPress(char);
        if (isShift && !isNumbers) {
          setIsShift(false);
        }
    }
  };

  const handleSpaceDown = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    setIsSpacePressed(true);
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    setSpaceStartX(clientX);
    
    // Start long press timer
    spaceLongPressTimer.current = setTimeout(() => {
      setCursorMoveMode(true);
      // Add haptic feedback if available
      if (window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    }, 150); // 150ms to activate cursor mode
  };

  const handleSpaceMove = (e) => {
    if (cursorMoveMode && spaceStartX !== null) {
      if (e.cancelable) {
        e.preventDefault();
      }
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - spaceStartX;
      
      // Move cursor based on drag distance
      if (Math.abs(deltaX) > 10) {
        const direction = deltaX > 0 ? 1 : -1;
        onCursorMove && onCursorMove(direction);
        setSpaceStartX(clientX); // Reset start position
      }
    }
  };

  const handleSpaceUp = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    
    // Clear long press timer
    if (spaceLongPressTimer.current) {
      clearTimeout(spaceLongPressTimer.current);
      spaceLongPressTimer.current = null;
    }
    
    // If not in cursor mode, trigger space
    if (!cursorMoveMode) {
      onSpace && onSpace();
    }
    
    // Reset states
    setIsSpacePressed(false);
    setCursorMoveMode(false);
    setSpaceStartX(null);
  };

  const handleBackspaceDown = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    setPressedKey('backspace');
    
    // Xóa ký tự đầu tiên ngay lập tức
    onBackspace();
    
    // Bắt đầu timer để xóa liên tục sau 500ms
    backspaceLongPressTimer.current = setTimeout(() => {
      // Xóa với tốc độ chậm ban đầu (3 ký tự/giây)
      backspaceIntervalTimer.current = setInterval(() => {
        onBackspace();
      }, 100);
      
      // Sau 2 giây, tăng tốc độ xóa (10 ký tự/giây)
      backspaceAccelerationTimer.current = setTimeout(() => {
        if (backspaceIntervalTimer.current) {
          clearInterval(backspaceIntervalTimer.current);
          backspaceIntervalTimer.current = setInterval(() => {
            onBackspace();
          }, 50);
        }
      }, 2000);
    }, 500);
  };

  const handleBackspaceUp = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    setPressedKey(null);
    
    // Clear all timers
    if (backspaceLongPressTimer.current) {
      clearTimeout(backspaceLongPressTimer.current);
      backspaceLongPressTimer.current = null;
    }
    if (backspaceIntervalTimer.current) {
      clearInterval(backspaceIntervalTimer.current);
      backspaceIntervalTimer.current = null;
    }
    if (backspaceAccelerationTimer.current) {
      clearTimeout(backspaceAccelerationTimer.current);
      backspaceAccelerationTimer.current = null;
    }
  };

  const handleButtonPress = (e, key) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    handleKeyPress(key);
  };

  const getKeyClassName = (key) => {
    let className = 'key';
    
    if (key === 'space') {
      className += ' space-key';
      if (isSpacePressed) className += ' pressed';
      if (cursorMoveMode) className += ' cursor-mode';
    }
    else if (key === 'shift') className += ' modifier-key' + (isShift ? ' active' : '');
    else if (key === 'backspace') className += ' modifier-key';
    else if (key === '123' || key === 'ABC' || key === '#+=') className += ' modifier-key';
    else if (key === 'return') className += ' return-key';
    else if (key === 'lang') className += ' lang-key' + (isVietnamese ? ' vietnamese' : '');
    
    if (pressedKey === key) className += ' pressed';
    
    return className;
  };

  const renderKey = (key) => {
    let display = key;
    if (key === 'shift') display = isShift ? '⇪' : '⇧';
    else if (key === 'backspace') display = '⌫';
    else if (key === 'space') display = cursorMoveMode ? '⟷' : (isVietnamese ? 'dấu cách' : 'space');
    else if (key === 'return') display = isVietnamese ? 'nhập' : 'return';
    else if (key === 'lang') display = isVietnamese ? 'VI' : 'EN';
    
    return display;
  };

  return (
    <div 
      className={`virtual-keyboard ${isVisible ? 'visible' : ''}`}
      onMouseDown={(e) => {
        // Ngăn chặn blur event khi click vào bất kỳ đâu trong keyboard
        if (e.cancelable) {
          e.preventDefault();
        }
      }}
      onTouchStart={(e) => {
        // Ngăn chặn blur event khi touch vào bất kỳ đâu trong keyboard trên mobile
        if (e.cancelable) {
          e.preventDefault();
        }
      }}
    >
      <div 
        className="keyboard-container" 
        tabIndex={-1}
        onMouseDown={(e) => {
          // Ngăn chặn blur event khi click vào keyboard
          if (e.cancelable) {
            e.preventDefault();
          }
        }}
        onTouchStart={(e) => {
          // Ngăn chặn blur event khi touch vào keyboard trên mobile
          if (e.cancelable) {
            e.preventDefault();
          }
        }}
      >
        {currentLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => (
              key === 'space' ? (
                <button
                  key={key}
                  className={getKeyClassName(key)}
                  onMouseDown={handleSpaceDown}
                  onMouseMove={handleSpaceMove}
                  onMouseUp={handleSpaceUp}
                  onMouseLeave={handleSpaceUp}
                  onTouchStart={handleSpaceDown}
                  onTouchMove={handleSpaceMove}
                  onTouchEnd={handleSpaceUp}
                  onTouchCancel={handleSpaceUp}
                >
                  {renderKey(key)}
                </button>
              ) : key === 'backspace' ? (
                <button
                  key={key}
                  className={getKeyClassName(key)}
                  onMouseDown={handleBackspaceDown}
                  onMouseUp={handleBackspaceUp}
                  onMouseLeave={handleBackspaceUp}
                  onTouchStart={handleBackspaceDown}
                  onTouchEnd={handleBackspaceUp}
                  onTouchCancel={handleBackspaceUp}
                >
                  {renderKey(key)}
                </button>
              ) : (
                <button
                  key={key}
                  className={getKeyClassName(key)}
                  onMouseDown={!isTouchDevice ? (e) => handleButtonPress(e, key) : undefined}
                  onTouchStart={isTouchDevice ? (e) => handleButtonPress(e, key) : undefined}
                  onTouchEnd={(e) => e.preventDefault()}
                >
                  {renderKey(key)}
                </button>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard; 