import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

const SearchBar = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  onClear,
  loading = false,
  debounceTime = 300,
  className = '',
  autoFocus = false,
  showClearButton = true,
  darkMode = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Auto focus the input if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle input change with debounce
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Call the immediate onChange handler if provided
    if (onChange) {
      onChange(newValue);
    }
    
    // Set up debounced search
    if (onSearch) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceTime);
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setInputValue('');
    
    if (onChange) {
      onChange('');
    }
    
    if (onSearch) {
      onSearch('');
    }
    
    if (onClear) {
      onClear();
    }
    
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Cancel debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-10 py-2 rounded-lg border
                    ${darkMode 
                      ? 'bg-gray-900 text-white border-gray-700 focus:ring-white' 
                      : 'bg-white text-gray-900 border-gray-200 focus:ring-black'
                    }
                    focus:outline-none focus:ring-2`}
        />
        
        {/* Show spinner if loading */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-4 w-4 text-gray-400 dark:text-gray-500 animate-spin" />
          </div>
        )}
        
        {/* Clear button */}
        {showClearButton && inputValue && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
