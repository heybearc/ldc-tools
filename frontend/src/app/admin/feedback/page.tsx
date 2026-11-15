'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';

interface FeedbackItem {
  id: string;
  feedbackNumber?: string;
  type: 'bug' | 'enhancement' | 'feature';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  submittedBy: {
    name: string;
    email: string;
    role: string;
  };
  submittedAt: string;
  updatedAt: string;
  attachments: Array<{
    id: string;
    filename: string;
    fileData: string;
    mimeType: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
    attachments?: Array<{
      id: string;
      filename: string;
      fileData: string;
      mimeType: string;
    }>;
  }>;
}

interface FeedbackStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
}

export default function FeedbackManagementPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({ total: 0, new: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [statusError, setStatusError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [commentScreenshots, setCommentScreenshots] = useState<string[]>([]);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/v1/admin/feedback', { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        const items = data.data.feedback as FeedbackItem[];
        setFeedback(items);
        setStats(data.data.stats);
        return items;
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'enhancement': return '⚡';
      case 'feature': return '✨';
      default: return '💡';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'enhancement': return 'bg-blue-100 text-blue-800';
      case 'feature': return 'bg-green-100 text-green-800';
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

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleCommentPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageData = event.target?.result as string;
            setCommentScreenshots(prev => [...prev, imageData]);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const removeCommentScreenshot = (index: number) => {
    setCommentScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = async () => {
    if (!selectedFeedback || !newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/v1/admin/feedback/${selectedFeedback.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          content: newComment.trim(),
          screenshots: commentScreenshots
        })
      });

      if (response.ok) {
        await fetchFeedback();
        setNewComment('');
        setCommentScreenshots([]);
        setShowCommentModal(false);
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

  const handleChangeStatus = async () => {
    if (!selectedFeedback || !newStatus) return;
    if (newStatus === 'resolved' && !resolutionComment.trim()) {
      setStatusError('A resolution note is required to mark this resolved.');
      return;
    }
    
    setUpdatingStatus(true);
    setStatusError('');
    try {
      const response = await fetch(`/api/v1/admin/feedback/${selectedFeedback.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          resolutionComment: resolutionComment.trim() || undefined,
        })
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success !== false) {
        const items = await fetchFeedback();
        const updated = items?.find((item) => item.id === selectedFeedback.id);
        if (updated) setSelectedFeedback(updated);
        setShowStatusModal(false);
        setResolutionComment('');
      } else {
        setStatusError(data.error || 'Could not update the status.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusError('Could not update the status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">💡 Feedback Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage user feedback, bug reports, and feature requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2 sm:mb-0 flex-shrink-0">
              <span className="text-white text-sm font-bold">{stats.total}</span>
            </div>
            <div className="sm:ml-4 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mb-2 sm:mb-0 flex-shrink-0">
              <span className="text-white text-sm font-bold">{stats.new}</span>
            </div>
            <div className="sm:ml-4 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">New</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.new}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mb-2 sm:mb-0 flex-shrink-0">
              <span className="text-white text-sm font-bold">{stats.inProgress}</span>
            </div>
            <div className="sm:ml-4 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2 sm:mb-0 flex-shrink-0">
              <span className="text-white text-sm font-bold">{stats.resolved}</span>
            </div>
            <div className="sm:ml-4 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 sm:space-x-4">
          {[
            { key: 'all', label: 'All Feedback' },
            { key: 'new', label: 'New' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
            { key: 'closed', label: 'Closed' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Feedback Items ({filteredFeedback.length})
          </h3>
        </div>
        
        {filteredFeedback.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-600">No feedback items match the current filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFeedback.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {item.feedbackNumber ? `${item.feedbackNumber} · ` : ''}{item.title}
                    </h4>
                    <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>👤 {item.submittedBy.name}</span>
                      <span>📅 {new Date(item.submittedAt).toLocaleDateString()}</span>
                      {item.comments.length > 0 && (
                        <span>💬 {item.comments.length} comment{item.comments.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => {
                        setSelectedFeedback(item);
                        setShowDetailsModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.description}</p>
                  </div>
                </div>

                {/* Feedback Screenshots */}
                {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Screenshots ({selectedFeedback.attachments.length})</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedFeedback.attachments.map((attachment) => (
                        <div key={attachment.id} className="border border-gray-300 rounded-lg overflow-hidden">
                          <img 
                            src={attachment.fileData} 
                            alt={attachment.filename}
                            className="w-full h-auto cursor-pointer hover:opacity-90"
                            onClick={() => window.open(attachment.fileData, '_blank')}
                          />
                          <div className="bg-gray-100 px-3 py-2 text-sm text-gray-700">
                            {attachment.filename}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Submitted By</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="text-gray-900">{selectedFeedback.submittedBy.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-gray-900">{selectedFeedback.submittedBy.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <p className="text-gray-900">{selectedFeedback.submittedBy.role}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Comments</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedFeedback.comments.length === 0 ? (
                      <p className="text-gray-500 italic">No comments yet</p>
                    ) : (
                      <div className="space-y-4">
                        {selectedFeedback.comments.map((comment) => (
                          <div key={comment.id} className="bg-white rounded p-3 border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-gray-900">👨‍💼 {comment.author}</p>
                              <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                            <p className="text-gray-700 mb-3">{comment.content}</p>
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {comment.attachments.map((attachment) => (
                                  <div key={attachment.id} className="border border-gray-200 rounded overflow-hidden">
                                    <img 
                                      src={attachment.fileData} 
                                      alt={attachment.filename}
                                      className="w-full h-auto cursor-pointer hover:opacity-90"
                                      onClick={() => window.open(attachment.fileData, '_blank')}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setNewComment('');
                    setShowCommentModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Add Comment
                </button>
                <button 
                  onClick={() => {
                    setNewStatus(selectedFeedback.status);
                    setResolutionComment('');
                    setStatusError('');
                    setShowStatusModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Change Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showCommentModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Comment</h3>
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment
                </label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onPaste={handleCommentPaste}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your comment... (Ctrl/Cmd+V to paste screenshots)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  💡 Tip: You can paste screenshots directly with Ctrl/Cmd+V
                </p>
                
                {/* Comment Screenshot Previews */}
                {commentScreenshots.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Screenshots ({commentScreenshots.length}):</p>
                    <div className="grid grid-cols-2 gap-3">
                      {commentScreenshots.map((screenshot, index) => (
                        <div key={index} className="relative border border-gray-300 rounded-lg overflow-hidden">
                          <img src={screenshot} alt={`Screenshot ${index + 1}`} className="w-full h-auto" />
                          <button
                            type="button"
                            onClick={() => removeCommentScreenshot(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            aria-label="Remove screenshot"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1">
                            Screenshot {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Change status{selectedFeedback.feedbackNumber ? ` · ${selectedFeedback.feedbackNumber}` : ''}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <select
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value);
                    setStatusError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                {newStatus === 'resolved' && (
                  <textarea
                    rows={3}
                    value={resolutionComment}
                    onChange={(e) => setResolutionComment(e.target.value)}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Resolution note (required)"
                  />
                )}
                {statusError ? <p className="mt-3 text-sm text-red-600">{statusError}</p> : null}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeStatus}
                  disabled={updatingStatus || newStatus.toLowerCase() === selectedFeedback.status.toLowerCase()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
