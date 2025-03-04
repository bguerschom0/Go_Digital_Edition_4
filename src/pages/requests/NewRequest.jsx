import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../config/supabase';
import RequestForm from '../../components/requests/RequestForm';
import FileUploader from '../../components/requests/FileUploader';

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Handle request form submission
  const handleRequestSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Insert request into database
      const { data, error } = await supabase
        .from('requests')
        .insert([{
          ...formData,
          created_by: user.id,
          status: 'pending',
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Store request data and move to next step
      setRequestData(data);
      setStep(2);
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload completion
  const handleUploadComplete = (filesCount) => {
    setUploadComplete(true);
  };

  // Handle completion and navigate to request detail
  const handleComplete = () => {
    navigate(`/requests/${requestData.id}`);
  };

  // Handle cancel and navigate back to requests list
  const handleCancel = () => {
    navigate('/requests');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={handleCancel}
          className="flex items-center mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                   dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </button>
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Request
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Complete the form to record a new document request.
          </p>
          
          {/* Progress steps */}
          <div className="mt-8 flex items-center">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full 
                          ${step >= 1 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              1
            </div>
            <div className={`h-1 flex-grow mx-2 
                          ${step >= 2 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`flex items-center justify-center h-8 w-8 rounded-full
                          ${step >= 2 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              2
            </div>
            <div className={`h-1 flex-grow mx-2 
                          ${step >= 3 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`flex items-center justify-center h-8 w-8 rounded-full
                          ${step >= 3 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              3
            </div>
          </div>
          
          <div className="mt-2 grid grid-cols-3 text-xs">
            <div className="text-center">Request Details</div>
            <div className="text-center">Upload Documents</div>
            <div className="text-center">Complete</div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Step 1: Request Form */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RequestForm 
              onSubmit={handleRequestSubmit}
              onCancel={handleCancel}
            />
          </motion.div>
        )}
        
        {/* Step 2: File Upload */}
        {step === 2 && requestData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Upload Documents (Optional)
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload any relevant documents for this request. You can skip this step if no documents are available.
            </p>
            
            <FileUploader 
              requestId={requestData.id}
              onUploadComplete={handleUploadComplete}
              isResponseUpload={false}
            />
            
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setStep(3)}
                disabled={loading}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                         hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                {uploadComplete ? 'Continue' : 'Skip'}
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Step 3: Completion */}
        {step === 3 && requestData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Request Created Successfully
              </h2>
              
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Your request has been recorded with reference number <strong>{requestData.reference_number}</strong>. You can view the request details or return to the requests list.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/requests')}
                  className="px-6 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg 
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors order-2 sm:order-1"
                >
                  Return to List
                </button>
                
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                           hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors order-1 sm:order-2"
                >
                  View Request Details
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NewRequest;
