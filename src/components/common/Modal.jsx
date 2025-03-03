import { useEffect, useRef } from 'react'
import Button from './Button'

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  const modalRef = useRef()

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        
        <div
          ref={modalRef}
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>
          
          <div className="px-6 py-4">{children}</div>
          
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
