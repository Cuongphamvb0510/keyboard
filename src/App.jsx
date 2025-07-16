import { useState, useRef, useEffect } from 'react'
import './App.css'
import VirtualKeyboard from './components/VirtualKeyboard'
import SimpleInput from './components/SimpleInput'
import { processVietnameseInput } from './utils/telex'

function App() {
  const [inputValue, setInputValue] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [isVietnamese, setIsVietnamese] = useState(false)
  const simpleInputRef = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    // Set viewport meta for mobile
    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      document.head.appendChild(meta)
    }
    
    // Update title
    document.title = 'iPhone Keyboard'
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appRef.current && !appRef.current.contains(event.target)) {
        setShowKeyboard(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showKeyboard])

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

  const handleInputFocus = () => {
    setShowKeyboard(true)
  }

  const handleInputChange = (value) => {
    setInputValue(value)
  }

  const handleLanguageChange = (isViet) => {
    setIsVietnamese(isViet)
  }

  return (
    <div className="app" ref={appRef}>
      <div className="container">
        <h1>iPhone</h1>
        
        <div className="input-demo">
          <label>Nhập văn bản:</label>
          <SimpleInput
            ref={simpleInputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Nhấp vào đây để nhập..."

          />
        </div>

        <div className="info">
          <p>Giá trị hiện tại: <strong>{inputValue || '(trống)'}</strong></p>
          <p>Chế độ: <strong>{isVietnamese ? 'Tiếng Việt (Telex)' : 'Tiếng Anh'}</strong></p>
        </div>
      </div>

      <VirtualKeyboard
        isVisible={showKeyboard}
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onSpace={handleSpace}
        onEnter={handleEnter}
        onCursorMove={handleCursorMove}
        onLanguageChange={handleLanguageChange}
      />
    </div>
  )
}

export default App
