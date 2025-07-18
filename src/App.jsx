import './App.css'
import Page from './components/Page'
import Home from './pages/Home'
import VirtualKeyboard from './components/VirtualKeyboard'
import { KeyboardProvider } from './context/KeyboardContext.jsx'
import { useKeyboard } from './hooks/useKeyboard'
import { useState, useEffect } from 'react'
import { processVietnameseInput } from './utils/telex'

function AppContent() {
  const { showKeyboard, setShowKeyboard, isVietnamese, setIsVietnamese, simpleInputRef } = useKeyboard()
  const [inputValue, setInputValue] = useState('')

  // Đảm bảo input giữ focus khi keyboard hiển thị
  useEffect(() => {
    if (showKeyboard && simpleInputRef.current) {
      simpleInputRef.current.focus();
    }
  }, [showKeyboard, simpleInputRef]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải ở input hoặc container của input không
      const inputElement = simpleInputRef.current?.getInputElement?.();
      const inputContainer = inputElement?.parentElement;
      const isClickOnInput = (inputElement && inputElement.contains(event.target)) || 
                            (inputContainer && inputContainer.contains(event.target));
      
      // Kiểm tra xem click có phải ở keyboard không
      const keyboardElement = document.querySelector('.virtual-keyboard');
      const isClickOnKeyboard = keyboardElement && keyboardElement.contains(event.target);
      
      // Chỉ ẩn keyboard khi click không phải ở input VÀ không phải ở keyboard
      if (!isClickOnInput && !isClickOnKeyboard && showKeyboard) {
        setShowKeyboard(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showKeyboard, setShowKeyboard, simpleInputRef])

  const handleKeyPress = (key) => {
    if (simpleInputRef.current) {
      if (isVietnamese) {
        // Xử lý tiếng Việt với Telex
        const cursorPos = simpleInputRef.current.getCursorPosition();
        const result = processVietnameseInput(inputValue, cursorPos, key);
        
        // Cập nhật toàn bộ text
        setInputValue(result.text);
        
        // Đặt lại vị trí cursor
        setTimeout(() => {
          simpleInputRef.current.setCursorPosition(result.cursorPosition);
        }, 0);
      } else {
        // Xử lý tiếng Anh bình thường
        simpleInputRef.current.insertTextAtCursor(key);
      }
    }
  }

  const handleBackspace = () => {
    if (simpleInputRef.current) {
      simpleInputRef.current.deleteAtCursor()
    }
  }

  const handleSpace = () => {
    handleKeyPress(' ')
  }

  const handleEnter = () => {
    console.log('Enter pressed:', inputValue)
    // Bạn có thể thêm logic xử lý khi nhấn Enter ở đây
  }

  const handleCursorMove = (direction) => {
    if (simpleInputRef.current) {
      const currentPos = simpleInputRef.current.getCursorPosition()
      const newPos = Math.max(0, Math.min(inputValue.length, currentPos + direction))
      simpleInputRef.current.setCursorPosition(newPos)
    }
  }

  const handleLanguageChange = (isViet) => {
    setIsVietnamese(isViet)
  }

  return (
    <>
      <Page isKeyboardVisible={showKeyboard}>
        <Home inputValue={inputValue} setInputValue={setInputValue} />
      </Page>
      
      <VirtualKeyboard
        isVisible={showKeyboard}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onSpace={handleSpace}
        onEnter={handleEnter}
        onCursorMove={handleCursorMove}
        onLanguageChange={handleLanguageChange}
      />
    </>
  )
}

function App() {
  return (
    <KeyboardProvider>
      <AppContent />
    </KeyboardProvider>
  )
}

export default App
