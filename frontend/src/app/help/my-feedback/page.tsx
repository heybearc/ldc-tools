'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FeedbackItem {
  id: string;
  feedbackNumber?: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  comments: Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
  }>;
}

export default function MyFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchMyFeedback();
  }, []);

  const fetchMyFeedback = async () => {
    try {
      const response = await fetch('/api/v1/feedback/my-feedback');
      const data = await response.json();
      
      if (data.success) {
        setFeedback(data.data.feedback);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedFeedback || !newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/v1/feedback/${selectedFeedback.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (response.ok) {
        // Fetch updated feedback data
        const feedbackResponse = await fetch('/api/v1/feedback/my-feedback');
        const feedbackData = await feedbackResponse.json();
        
        if (feedbackData.success) {
          const updatedFeedbackList = feedbackData.data.feedback;
          setFeedback(updatedFeedbackList);
          
          // Update the selected feedback with the latest data
          const updatedItem = updatedFeedbackList.find((f: FeedbackItem) => f.id === selectedFeedback.id);
          if (updatedItem) {
            setSelectedFeedback(updatedItem);
          }
        }
        
        setNewComment('');
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'enhancement': return '⚡';
      case 'feature': return '✨';
      case 'question': return '❓';
      default: return '💡';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'enhancement': return 'bg-blue-100 text-blue-800';
      case 'feature': return 'bg-green-100 text-green-800';
      case 'question': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center text-sm text-gray-600">
        <Link href="/" className="hover:text-blue-600">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <Link href="/help" className="hover:text-blue-600">
          Help Center
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">My Feedback</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 My Feedback</h1>
        <p className="text-gray-600">
          Track the status of your submitted feedback and see admin responses
        </p>
      </div>

      {feedback.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No feedback submitted yet</h3>
          <p className="text-gray-600 mb-6">
            You haven't submitted any feedback yet. Submit your first feedback to see it here.
          </p>
          <Link
            href="/help/feedback"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
          >
            Submit Feedback
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {feedback.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {item.comments.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        💬 {item.comments.length} response{item.comments.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {item.feedbackNumber ? `${item.feedbackNumber} · ` : ''}{item.title}
                  </h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span>📅 Submitted {new Date(item.submittedAt).toLocaleDateString()}</span>
                    <span>🔄 Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                    {item.attachments.length > 0 && (
                      <span>📎 {item.attachments.length} attachment{item.attachments.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedFeedback(item);
                      setShowDetailsModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Details Modal */}
      {showDetailsModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedFeedback.type)}`}>
                      {getTypeIcon(selectedFeedback.type)} {selectedFeedback.type.charAt(0).toUpperCase() + selectedFeedback.type.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedFeedback.priority)}`}>
                      {selectedFeedback.priority.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}>
                      {selectedFeedback.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedFeedback.feedbackNumber ? `${selectedFeedback.feedbackNumber} · ` : ''}{selectedFeedback.title}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your Feedback</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.description}</p>
                  </div>
                </div>

                {/* Comments & Conversation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Conversation</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedFeedback.comments.length === 0 ? (
                      <p className="text-gray-500 italic mb-4">No comments yet. Start the conversation below!</p>
                    ) : (
                      <div className="space-y-4 mb-4">
                        {selectedFeedback.comments.map((comment) => (
                          <div key={comment.id} className="bg-white rounded p-4 border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-gray-900">
                                {comment.author.includes('System') || comment.author.includes('Admin') ? '👨‍💼' : '👤'} {comment.author}
                              </p>
                              <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Comment Form - Only for active feedback */}
                    {(selectedFeedback.status === 'new' || selectedFeedback.status === 'in_progress') && (
                      <div className="border-t pt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Add Your Comment</h4>
                        <div className="space-y-4">
                          <textarea
                            rows={3}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add a follow-up comment, provide more details, or ask a question..."
                          />
                          
                          <div className="flex justify-end">
                            <button
                              onClick={handleAddComment}
                              disabled={submittingComment || !newComment.trim()}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-sm"
                            >
                              {submittingComment ? 'Adding...' : 'Add Comment'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Resolved/Closed Message */}
                    {(selectedFeedback.status === 'resolved' || selectedFeedback.status === 'closed') && (
                      <div className="border-t pt-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700">
                            <strong>This feedback is {selectedFeedback.status}.</strong> 
                            {selectedFeedback.status === 'resolved' 
                              ? ' If you need to add more information, you can submit new feedback.'
                              : ' This conversation has been closed.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {selectedFeedback.attachments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your Attachments</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {selectedFeedback.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between bg-white rounded p-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">📎</span>
                              <div>
                                <p className="font-medium text-gray-900">{attachment.filename}</p>
                                <p className="text-sm text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Close
                </button>
                <Link
                  href="/help/feedback"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Submit New Feedback
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
