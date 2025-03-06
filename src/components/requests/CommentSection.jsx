import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Send, UserCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentSection = ({ requestId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch comments for the request
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('v4_comments')
          .select(`
            id,
            content,
            created_at,
            is_internal,
            user_id,
            users:user_id (
              id,
              full_name,
              username,
              user_role_v4
            )
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setComments(data || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Set up real-time subscription for new comments
    const commentSubscription = supabase
      .channel('public:v4_comments')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'v4_comments',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        // Fetch the new comment with user data
        const fetchNewComment = async () => {
          const { data, error } = await supabase
            .from('v4_comments')
            .select(`
              id,
              content,
              created_at,
              is_internal,
              user_id,
              users:user_id (
                id,
                full_name,
                username,
                user_role_v4
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setComments(prev => [...prev, data]);
          }
        };
        
        fetchNewComment();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(commentSubscription);
    };
  }, [requestId]);

  // Scroll to bottom when new comments are added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to the scrollHeight to fit the content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  // Submit a new comment
const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      // Determine if comment should be internal (only for admin/user roles)
      const isInternal = false; // Set to true if implementing internal-only comments

      const { data, error } = await supabase
        .from('v4_comments')
        .insert([
          {
            request_id: requestId,
            user_id: user.id,
            content: newComment.trim(),
            is_internal: isInternal
          },
        ])
        .select(); // Add this to get back the inserted comment with its ID
        
      if (error) throw error;
      
      setNewComment('');
      
      // Call the comment notification callback if provided
      if (onCommentAdded && data && data[0]) {
        onCommentAdded(data[0]);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get user's avatar color based on role
  const getUserAvatarColor = (role) => {
    switch(role) {
      case 'administrator':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      case 'user':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'organization':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'administrator':
        return 'Admin';
      case 'user':
        return 'Staff';
      case 'organization':
        return 'Organization';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Comments
      </h3>
      
      {/* Comments list */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to add a comment.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div 
                key={comment.id} 
                className={`flex gap-3 ${
                  comment.user_id === user.id 
                    ? 'justify-end' 
                    : 'justify-start'
                }`}
              >
                {comment.user_id !== user.id && (
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getUserAvatarColor(comment.users.user_role_v4)}`}>
                    <UserCircle className="h-5 w-5" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  comment.user_id === user.id 
                    ? 'bg-black text-white dark:bg-white dark:text-black ml-auto' 
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {comment.user_id === user.id ? 'You' : comment.users.full_name}
                      {comment.users.user_role_v4 && (
                        <span className="ml-1 opacity-70">
                          ({getRoleDisplayName(comment.users.user_role_v4)})
                        </span>
                      )}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{comment.content}</p>
                </div>
                
                {comment.user_id === user.id && (
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getUserAvatarColor(user.role)}`}>
                    <UserCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>
      
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type your comment..."
          className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 dark:border-gray-700 
                   bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none
                   focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          rows="1"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="absolute right-2 bottom-2 p-2 rounded-full bg-black dark:bg-white text-white dark:text-black
                   hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
