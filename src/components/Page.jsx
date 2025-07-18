import React from 'react'
import './Page.css'

function Page({ children, isKeyboardVisible }) {
  return (
    <div className={`page ${isKeyboardVisible ? 'keyboard-visible' : ''}`}>
      <div className="page-container">
        {children}
      </div>
    </div>
  )
}

export default Page 