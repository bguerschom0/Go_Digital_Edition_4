import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Loader2, ShieldCheck } from 'lucide-react';

const UnlockAccountModal = ({ isOpen, onClose, onUnlock, user }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setSuccess(false);
    
    try {
      await onUnlock(user.id);
      setSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error unlocking account:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Unlock Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-green-600 dark:text-green-400">
            <ShieldCheck className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">Account Unlocked Successfully</p>
          </div>
        ) : (
          <>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full mt-1">
                  <Lock className="w-5 h-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300">
                    Account Locked
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    This account has been locked due to too many failed login attempts.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Username
                  </label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Full Name
                  </label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.full_name}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Failed Attempts
                  </label>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {user.failed_login_attempts || 5}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Locked At
                  </label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(user.locked_at)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Unlocking this account will reset the failed login counter and allow the user to log in again. 
              Are you sure you want to proceed?
            </p>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isUnlocking}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                         dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black 
                         rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors
                         flex items-center gap-2 disabled:opacity-50"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unlock Account
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default UnlockAccountModal;
