const Card = ({ title, children, footer, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      
      <div className="px-6 py-4">{children}</div>
      
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card
