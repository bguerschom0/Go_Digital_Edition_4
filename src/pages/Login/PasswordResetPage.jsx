import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Key } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const PasswordResetPage = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Verify token and update password
      const { data, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('user_id')
        .eq('token', token)
        .single();

      if (tokenError) throw tokenError;

      if (!data) {
        setError('Invalid or expired token');
        return;
      }

      // Update user password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPassword }) // Replace with proper hashing
        .eq('id', data.user_id);

      if (updateError) throw updateError;

      // Delete used token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);

      setSuccess('Password reset successful');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Password reset failed');
      console.error('Password reset error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="w-96 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handlePasswordReset}>
          <div className="mb-4 relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-5 w-5 text-neutral-500" />
              </span>
              <input 
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full p-2 pl-10 rounded-md border border-neutral-300 text-center"
                placeholder="Reset Token"
                required
              />
            </div>
          </div>

          <div className="mb-4 relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-neutral-500" />
              </span>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 pl-10 rounded-md border border-neutral-300 text-center"
                placeholder="New Password"
                required
              />
            </div>
          </div>

          <div className="mb-6 relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-neutral-500" />
              </span>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 pl-10 rounded-md border border-neutral-300 text-center"
                placeholder="Confirm New Password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 transition-colors"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetPage;
