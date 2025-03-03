const Button = ({ children, onClick, variant = 'primary', disabled, fullWidth, className = '' }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200'
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300',
    outline: 'border-2 border-black text-black hover:bg-gray-100'
  }
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  )
}

export default Button
