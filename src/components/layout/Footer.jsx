import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 py-2">
      <div className="max-w-full px-4">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Go Digital Edition 4. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
