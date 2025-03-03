import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LoginComponent = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      // Attempt to sign in
      await signIn(username, password);
      
      // Clear form
      setUsername('');
      setPassword('');
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Set error message from the backend
      setError(err.message || 'Failed to sign in');
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8 relative transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#0A2647] rounded-full flex items-center justify-center animate-bounce-slow">
              <Send className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#0A2647] mb-2">
            Welcome
          </h2>
          <p className="text-gray-600 animate-fade-in">
            Sign in to access this portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2647] focus:border-transparent transition-all"
                placeholder="Username"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A2647] focus:border-transparent transition-all"
                placeholder="Password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#0A2647] text-white rounded-lg hover:bg-[#0A2647]/90 transition-all transform hover:scale-[1.02]"
            disabled={isLoading}
          >
            <span className="flex items-center justify-center">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Sign in to continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginComponent;
