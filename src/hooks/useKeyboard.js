import { useContext } from 'react'
import { KeyboardContext } from '../context/KeyboardContext.js'

export function useKeyboard() {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider')
  }
  return context
} 