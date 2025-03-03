import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

const TempPasswordModal = ({ isOpen, onClose, tempPassword }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Temporary Password Generated
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Please copy this temporary password. It will expire in 24 hours.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg font-mono text-lg break-all">
              {tempPassword}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-sm text-green-500 mt-2">
              ✓ Copied to clipboard
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <p>Important notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This password is valid for 24 hours only</li>
            <li>You will be required to change it upon first login</li>
            <li>Keep this password secure and do not share it</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TempPasswordModal;
