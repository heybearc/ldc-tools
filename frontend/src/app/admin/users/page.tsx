'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Mail, Search, Filter, MoreVertical, Edit, Trash2, UserCheck, UserX, Upload, UserPlus, Send, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  ldcRole?: string;
  constructionGroupId?: string;
  status: 'ACTIVE' | 'INVITED' | 'INACTIVE';
  regionId: string;
  zoneId: string;
  lastLogin?: string;
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  invited: number;
  inactive: number;
}

interface ConstructionGroup {
  id: string;
  code: string;
  name: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [constructionGroups, setConstructionGroups] = useState<ConstructionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });
  const [createForm, setCreateForm] = useState({ name: '', email: '', role: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [passwordManagement, setPasswordManagement] = useState({ changePassword: false, newPassword: '', sendResetEmail: false });
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside dropdown and button
      if (!target.closest('[id^="dropdown-"]') && !target.closest('[id^="actions-btn-"]')) {
        setOpenDropdownId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        await Promise.all([
          loadUsers(mounted),
          loadUserStats(mounted),
          loadConstructionGroups(mounted)
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const loadUsers = async (mounted = true) => {
    try {
      const response = await fetch('/api/v1/admin/users');
      if (response.ok && mounted) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  const loadUserStats = async (mounted = true) => {
    try {
      const response = await fetch('/api/v1/admin/users/stats');
      if (response.ok && mounted) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadConstructionGroups = async (mounted = true) => {
    try {
      const response = await fetch('/api/v1/admin/hierarchy/construction-groups');
      if (response.ok && mounted) {
        const data = await response.json();
        setConstructionGroups(data.constructionGroups || []);
      }
    } catch (error) {
      console.error('Failed to load construction groups:', error);
      // Set empty array on error to prevent infinite loop
      if (mounted) {
        setConstructionGroups([]);
      }
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/v1/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });
      
      if (response.ok) {
        alert('User invitation sent successfully!');
        setInviteForm({ name: '', email: '', role: '' });
        setIsInviteModalOpen(false);
        loadUsers();
        loadUserStats();
      } else {
        const errorData = await response.json();
        alert(`Failed to send invitation: ${errorData.error || errorData.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      
      if (response.ok) {
        alert('User created successfully!');
        setCreateForm({ name: '', email: '', role: '', password: '' });
        setIsCreateModalOpen(false);
        loadUsers();
        loadUserStats();
      } else {
        alert('Failed to create user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      const updateData: any = {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        ldcRole: selectedUser.ldcRole,
        constructionGroupId: selectedUser.constructionGroupId,
        status: selectedUser.status
      };

      // Add password if changing
      if (passwordManagement.changePassword && passwordManagement.newPassword) {
        if (passwordManagement.newPassword.length < 8) {
          alert('Password must be at least 8 characters');
          setIsSubmitting(false);
          return;
        }
        updateData.password = passwordManagement.newPassword;
      }

      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        alert('User updated successfully!');
        setIsEditModalOpen(false);
        setSelectedUser(null);
        setPasswordManagement({ changePassword: false, newPassword: '', sendResetEmail: false });
        loadUsers();
        loadUserStats();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || data.error || 'Failed to update user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (userId: string) => {
    if (!confirm('Cancel this invitation? They will stay on the personnel list as inactive and cannot accept the invite.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });

      if (response.ok) {
        alert('Invitation cancelled.');
        loadUsers();
        loadUserStats();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || data.error || 'Failed to cancel invitation.');
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      alert('Failed to cancel invitation.');
    }
  };

  const handleResendInvitation = async (userId: string) => {
    if (!confirm('Resend invitation email to this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}/resend-invite`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Invitation resent successfully!');
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to resend invitation. Please try again.');
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      alert('Failed to resend invitation. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('User deleted successfully!');
        loadUsers();
        loadUserStats();
      } else {
        alert('Failed to delete user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleBulkImport = async (file: File) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/v1/admin/users/import', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${result.imported} users!`);
        setIsBulkImportOpen(false);
        loadUsers();
        loadUserStats();
      } else {
        alert('Failed to import users. Please check file format.');
      }
    } catch (error) {
      console.error('Failed to import users:', error);
      alert('Failed to import users. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            User Management
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Personnel team for this region. Contact, Assistant, and Support.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
          >
            <Mail className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Invite User</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
          >
            <UserPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Create User</span>
          </button>
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex-1 sm:flex-none"
          >
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Bulk Import</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="flex-shrink-0 mb-2 sm:mb-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="sm:ml-5 w-full sm:w-0 sm:flex-1 text-center sm:text-left">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg sm:text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="flex-shrink-0 mb-2 sm:mb-0">
                  <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
                <div className="sm:ml-5 w-full sm:w-0 sm:flex-1 text-center sm:text-left">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg sm:text-lg font-medium text-gray-900">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="flex-shrink-0 mb-2 sm:mb-0">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                </div>
                <div className="sm:ml-5 w-full sm:w-0 sm:flex-1 text-center sm:text-left">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Invited</dt>
                    <dd className="text-lg sm:text-lg font-medium text-gray-900">{stats.invited}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="flex-shrink-0 mb-2 sm:mb-0">
                  <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                </div>
                <div className="sm:ml-5 w-full sm:w-0 sm:flex-1 text-center sm:text-left">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg sm:text-lg font-medium text-gray-900">{stats.inactive}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10 w-full px-3 py-2 min-h-[44px] text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="READ_ONLY">Read Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INVITED">Invited</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg pb-32">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({filteredUsers.length})
          </h3>
        </div>

        <div className="relative">
          <div className="overflow-x-auto pb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="sticky right-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.2)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">
                        {user.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.volunteerId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800" title="Linked to volunteer">
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Volunteer
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'INVITED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-right text-sm font-medium shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.2)]">
                      <div className="flex items-center justify-end space-x-2 relative">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button
                            ref={(el) => { buttonRefs.current[user.id] = el; }}
                            id={`actions-btn-${user.id}`}
                            onClick={(e) => {
                              if (openDropdownId === user.id) {
                                setOpenDropdownId(null);
                                setDropdownPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownPosition({
                                  top: rect.bottom + 8,
                                  left: Math.max(8, rect.right - 192)
                                });
                                setOpenDropdownId(user.id);
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            title="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdownId === user.id && dropdownPosition && typeof window !== 'undefined' ? createPortal(
                            <div 
                              id={`dropdown-${user.id}`}
                              className="fixed w-48 bg-white rounded-md shadow-xl z-[9999] border border-gray-200"
                              style={{
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`,
                                maxHeight: '300px',
                                overflowY: 'auto'
                              }}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsEditModalOpen(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </button>
                                {user.status === 'INVITED' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleResendInvitation(user.id);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                                    >
                                      <Mail className="mr-2 h-4 w-4" />
                                      Resend Invitation
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleCancelInvitation(user.id);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Cancel Invitation
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    handleDeleteUser(user.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </button>
                              </div>
                            </div>,
                            document.body
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Mail className="mr-2 h-5 w-5 text-blue-600" />
                Invite User
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Role *
                </label>
                <select
                  required
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="READ_ONLY_ADMIN">Read Only Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  System role controls platform access. Organizational roles are assigned through the volunteer record.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-green-600" />
                Create User
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="User will be prompted to change on first login"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Role</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ZONE_OVERSEER">Zone Overseer</option>
                  <option value="ZONE_OVERSEER_ASSISTANT">Zone Overseer Assistant</option>
                  <option value="ZONE_OVERSEER_SUPPORT">Zone Overseer Support</option>
                  <option value="CONSTRUCTION_GROUP_OVERSEER">Construction Group Overseer</option>
                  <option value="CONSTRUCTION_GROUP_OVERSEER_ASSISTANT">Construction Group Overseer Assistant</option>
                  <option value="CONSTRUCTION_GROUP_OVERSEER_SUPPORT">Construction Group Overseer Support</option>
                  <option value="TRADE_TEAM_OVERSEER">Trade Team Overseer</option>
                  <option value="TRADE_TEAM_OVERSEER_ASSISTANT">Trade Team Overseer Assistant</option>
                  <option value="TRADE_TEAM_OVERSEER_SUPPORT">Trade Team Overseer Support</option>
                  <option value="TRADE_CREW_OVERSEER">Trade Crew Overseer</option>
                  <option value="TRADE_CREW_OVERSEER_ASSISTANT">Trade Crew Overseer Assistant</option>
                  <option value="TRADE_CREW_OVERSEER_SUPPORT">Trade Crew Overseer Support</option>
                  <option value="PERSONNEL_CONTACT">Personnel Contact</option>
                  <option value="PERSONNEL_CONTACT_ASSISTANT">Personnel Contact Assistant</option>
                  <option value="PERSONNEL_CONTACT_SUPPORT">Personnel Contact Support</option>
                  <option value="FIELD_REP">Field Rep</option>
                  <option value="FIELD_REP_ASSISTANT">Field Rep Assistant</option>
                  <option value="FIELD_REP_SUPPORT">Field Rep Support</option>
                  <option value="DESIGN_CONTACT">Design Contact</option>
                  <option value="DESIGN_CONTACT_ASSISTANT">Design Contact Assistant</option>
                  <option value="DESIGN_CONTACT_SUPPORT">Design Contact Support</option>
                  <option value="PROJECT_CONSTRUCTION_COORDINATOR">Project Construction Coordinator</option>
                  <option value="PROJECT_CONSTRUCTION_COORDINATOR_ASSISTANT">Project Construction Coordinator Assistant</option>
                  <option value="PROJECT_CONSTRUCTION_COORDINATOR_SUPPORT">Project Construction Coordinator Support</option>
                  <option value="SAFETY_COORDINATOR">Safety Coordinator</option>
                  <option value="SAFETY_COORDINATOR_ASSISTANT">Safety Coordinator Assistant</option>
                  <option value="SAFETY_COORDINATOR_SUPPORT">Safety Coordinator Support</option>
                  <option value="READ_ONLY">Read Only</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Upload className="mr-2 h-5 w-5 text-gray-600" />
                Bulk Import Users
              </h3>
              <button
                onClick={() => setIsBulkImportOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload CSV or Excel file
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      CSV, XLS, or XLSX up to 10MB
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBulkImport(file);
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Required Columns:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• <strong>name</strong> - Full name of the user</li>
                  <li>• <strong>email</strong> - Email address (must be unique)</li>
                  <li>• <strong>role</strong> - User role (CFR, FR, DC, PCC, SC, etc.)</li>
                  <li>• <strong>regionId</strong> - Region identifier (optional)</li>
                  <li>• <strong>zoneId</strong> - Zone identifier (optional)</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsBulkImportOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Download comprehensive template with examples
                    const csvContent = `name,email,role,ldcRole,regionId,zoneId,status
John Doe,john.doe@example.com,ZONE_OVERSEER,ZONE_OVERSEER,01.12,01,ACTIVE
Jane Smith,jane.smith@example.com,TRADE_TEAM_OVERSEER,TRADE_TEAM_OVERSEER,01.12,01,ACTIVE
Bob Johnson,bob.johnson@example.com,PERSONNEL_CONTACT,PERSONNEL_CONTACT,01.12,01,ACTIVE
Alice Williams,alice.williams@example.com,READ_ONLY,,01.12,01,INVITED

# Role Options:
# SUPER_ADMIN, ZONE_OVERSEER, ZONE_OVERSEER_ASSISTANT, ZONE_OVERSEER_SUPPORT
# CONSTRUCTION_GROUP_OVERSEER, CONSTRUCTION_GROUP_OVERSEER_ASSISTANT, CONSTRUCTION_GROUP_OVERSEER_SUPPORT
# TRADE_TEAM_OVERSEER, TRADE_TEAM_OVERSEER_ASSISTANT, TRADE_TEAM_OVERSEER_SUPPORT
# TRADE_CREW_OVERSEER, TRADE_CREW_OVERSEER_ASSISTANT, TRADE_CREW_OVERSEER_SUPPORT
# PERSONNEL_CONTACT, PERSONNEL_CONTACT_ASSISTANT, PERSONNEL_CONTACT_SUPPORT
# FIELD_REP, FIELD_REP_ASSISTANT, FIELD_REP_SUPPORT
# DESIGN_CONTACT, DESIGN_CONTACT_ASSISTANT, DESIGN_CONTACT_SUPPORT
# PROJECT_CONSTRUCTION_COORDINATOR, PROJECT_CONSTRUCTION_COORDINATOR_ASSISTANT, PROJECT_CONSTRUCTION_COORDINATOR_SUPPORT
# SAFETY_COORDINATOR, SAFETY_COORDINATOR_ASSISTANT, SAFETY_COORDINATOR_SUPPORT
# READ_ONLY

# Status Options: ACTIVE, INVITED, INACTIVE
# ldcRole is optional - use for organizational roles`;
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ldc_tools_user_import_template.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  📥 Download Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Edit className="mr-2 h-5 w-5 text-blue-600" />
                Edit User: {selectedUser.name}
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">User</option>
                  <option value="READ_ONLY">Read Only</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Platform access role. Organizational roles are managed through Volunteers.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Construction Group
                </label>
                <select
                  value={selectedUser.constructionGroupId || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, constructionGroupId: e.target.value || undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {constructionGroups.map(cg => (
                    <option key={cg.id} value={cg.id}>{cg.code}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedUser.status}
                  onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value as 'ACTIVE' | 'INVITED' | 'INACTIVE'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INVITED">Invited</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Password Management Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Password Management</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={passwordManagement.changePassword}
                      onChange={(e) => setPasswordManagement({...passwordManagement, changePassword: e.target.checked, newPassword: '', sendResetEmail: false})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">Change user password</span>
                  </label>

                  {passwordManagement.changePassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordManagement.newPassword}
                        onChange={(e) => setPasswordManagement({...passwordManagement, newPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password (min 8 characters)"
                        minLength={8}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Password Reset Options: Check the box above to change the user's password, or use the "Send Password Reset Email" button to let them reset it themselves.
                      </p>
                    </div>
                  )}

                  {!passwordManagement.changePassword && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedUser) return;
                        if (!confirm(`Send password reset email to ${selectedUser.email}?`)) return;
                        
                        try {
                          const response = await fetch(`/api/v1/admin/users/${selectedUser.id}/reset-password`, {
                            method: 'POST'
                          });
                          
                          if (response.ok) {
                            alert('Password reset email sent successfully!');
                          } else {
                            alert('Failed to send password reset email.');
                          }
                        } catch (error) {
                          console.error('Failed to send reset email:', error);
                          alert('Failed to send password reset email.');
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      📧 Send Password Reset Email
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
