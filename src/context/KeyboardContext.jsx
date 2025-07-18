import { useState, useRef } from 'react'
import { KeyboardContext } from './KeyboardContext'

export function KeyboardProvider({ children }) {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [isVietnamese, setIsVietnamese] = useState(false)
  const simpleInputRef = useRef(null)

  const value = {
    showKeyboard,
    setShowKeyboard,
    isVietnamese,
    setIsVietnamese,
    simpleInputRef
  }

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  )
} 