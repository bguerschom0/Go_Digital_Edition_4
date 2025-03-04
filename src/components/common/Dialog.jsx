import React, { Fragment } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dialog = ({ 
  open, 
  onOpenChange, 
  children, 
  title,
  description,
  maxWidth = 'md',  // sm, md, lg, xl, full
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  const widthClass = maxWidthClasses[maxWidth] || maxWidthClasses.md;

  return (
    <AnimatePresence>
      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleOverlayClick}
        >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black bg-opacity-50"
          />
          
          {/* Dialog content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative ${widthClass} w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-10`}
          >
            {showCloseButton && (
              <button
                className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            {title && (
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
            )}
            
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DialogContent = ({ children, className = '', ...props }) => (
  <div 
    className={`relative ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const DialogHeader = ({ children, className = '', ...props }) => (
  <div 
    className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const DialogFooter = ({ children, className = '', ...props }) => (
  <div 
    className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const DialogTitle = ({ children, className = '', ...props }) => (
  <h2 
    className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
    {...props}
  >
    {children}
  </h2>
);

export const DialogDescription = ({ children, className = '', ...props }) => (
  <p 
    className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}
    {...props}
  >
    {children}
  </p>
);

export default Dialog;
