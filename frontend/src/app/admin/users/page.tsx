'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Mail, Search, Filter, MoreVertical, Edit, Trash2, UserCheck, UserX, Upload, UserPlus, Send, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  ldcRole?: string;
  constructionGroupId?: string;
  status: 'ACTIVE' | 'INVITED' | 'INACTIVE';
  emailVerified?: string | null;
  invitedAt?: string | null;
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
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [constructionGroups, setConstructionGroups] = useState<ConstructionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });
  const [createForm, setCreateForm] = useState({ name: '', email: '', role: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [passwordManagement, setPasswordManagement] = useState({ changePassword: false, newPassword: '', sendResetEmail: false });
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkGroup, setBulkGroup] = useState('');
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
        toast.success('Invitation email sent.');
        setInviteForm({ name: '', email: '', role: '' });
        loadUsers();
        loadUserStats();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || errorData.message || 'Failed to send invitation.');
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast.error('Failed to send invitation. Please try again.');
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
        toast.success('User created.');
        setCreateForm({ name: '', email: '', role: '', password: '' });
        setIsCreateModalOpen(false);
        loadUsers();
        loadUserStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || errorData.message || 'Failed to create user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user. Please try again.');
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
          toast.error('Password must be at least 8 characters');
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
        toast.success('User updated.');
        setIsEditModalOpen(false);
        setSelectedUser(null);
        setPasswordManagement({ changePassword: false, newPassword: '', sendResetEmail: false });
        loadUsers();
        loadUserStats();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.message || data.error || 'Failed to update user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (userId: string) => {
    const accepted = await toast.confirm(
      'Cancel this invitation? They will stay on the personnel list as inactive and cannot accept the invite.',
      { confirmLabel: 'Cancel invitation', cancelLabel: 'Keep invitation' }
    );
    if (!accepted) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });

      if (response.ok) {
        toast.success('Invitation cancelled.');
        loadUsers();
        loadUserStats();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.message || data.error || 'Failed to cancel invitation.');
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error('Failed to cancel invitation.');
    }
  };

  const handleSendInvitation = async (user: User) => {
    const accepted = await toast.confirm(
      user.invitedAt
        ? 'Resend the invitation email to this person?'
        : 'Send an invitation so this person can set up their account?',
      { confirmLabel: 'Send email', cancelLabel: 'Not now' }
    );
    if (!accepted) return;
    
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/resend-invite`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Invitation email sent.');
        loadUsers();
        loadUserStats();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send invitation. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const accepted = await toast.confirm(
      'Delete this user? This cannot be undone.',
      { confirmLabel: 'Delete user', cancelLabel: 'Keep user' }
    );
    if (!accepted) return;
    
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('User deleted.');
        loadUsers();
        loadUserStats();
      } else {
        toast.error('Failed to delete user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user. Please try again.');
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
        toast.success(`Imported ${result.imported} users.`);
        setIsBulkImportOpen(false);
        loadUsers();
        loadUserStats();
      } else {
        toast.error('Failed to import users. Please check file format.');
      }
    } catch (error) {
      console.error('Failed to import users:', error);
      toast.error('Failed to import users. Please try again.');
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

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedUserIds((current) => {
      const allSelected = filteredUsers.length > 0 && filteredUsers.every((user) => current.has(user.id));
      if (allSelected) return new Set();
      return new Set(filteredUsers.map((user) => user.id));
    });
  };

  const handleBulkApply = async () => {
    if (selectedUserIds.size === 0) return;
    if (!bulkRole && !bulkStatus && !bulkGroup) {
      toast.error('Choose access, status, or a construction group.');
      return;
    }

    const body: Record<string, unknown> = { ids: Array.from(selectedUserIds) };
    if (bulkRole) body.role = bulkRole;
    if (bulkStatus) body.status = bulkStatus;
    if (bulkGroup) body.constructionGroupId = bulkGroup === 'none' ? null : bulkGroup;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || 'Failed to update the selected accounts.');
        return;
      }
      if (data.updated) toast.success(`Updated ${data.updated} ${data.updated === 1 ? 'account' : 'accounts'}.`);
      if (data.errors?.length) toast.error(data.errors.slice(0, 3).join(' '));
      setBulkRole('');
      setBulkStatus('');
      setBulkGroup('');
      setSelectedUserIds(new Set());
      loadUsers();
      loadUserStats();
    } catch (error) {
      console.error('Failed to update selected accounts:', error);
      toast.error('Failed to update the selected accounts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkInvite = async () => {
    const inviteIds = users
      .filter((user) => selectedUserIds.has(user.id) && !user.emailVerified)
      .map((user) => user.id);
    if (inviteIds.length === 0) {
      toast.error('The selected accounts have already been set up.');
      return;
    }

    const accepted = await toast.confirm(
      `Send invitation emails to ${inviteIds.length} ${inviteIds.length === 1 ? 'person' : 'people'}?`,
      { confirmLabel: 'Send emails', cancelLabel: 'Not now' }
    );
    if (!accepted) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: inviteIds, sendInvitations: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error || 'Failed to send invitations.');
        return;
      }
      if (data.invited) toast.success(`Invitation sent to ${data.invited} ${data.invited === 1 ? 'person' : 'people'}.`);
      if (data.errors?.length) toast.error(data.errors.slice(0, 3).join(' '));
      setSelectedUserIds(new Set());
      loadUsers();
      loadUserStats();
    } catch (error) {
      console.error('Failed to send invitations:', error);
      toast.error('Failed to send invitations.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Accounts
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Sign-in accounts for this construction group. Personnel, admins, and people you invited. Directory contacts stay in the directory.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => document.getElementById('invite-email')?.focus()}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
          >
            <Mail className="h-4 w-4 mr-2" />
            Invite someone
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

      <section id="invite-user" className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Mail className="mr-2 h-5 w-5 text-blue-600" />
          Invite someone
        </h3>
        <p className="mt-1 mb-4 text-sm text-gray-600">
          This sends an email with a link to set up their account. The link expires in 7 days.
          Someone who has not finished setup can receive that email from their row, including an account you created here.
        </p>
        <form onSubmit={handleInviteUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Name
            <input
              type="text"
              required
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First and last name"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              id="invite-email"
              type="email"
              required
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Access
            <select
              required
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select access</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="READ_ONLY_ADMIN">Read Only Admin</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send invitation email'}
            </button>
          </div>
        </form>
      </section>

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
          {selectedUserIds.size > 0 && (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <span className="text-sm text-gray-700 pb-2">{selectedUserIds.size} selected</span>
              <label className="text-xs text-gray-600">
                Access
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value)}
                  className="mt-1 block px-2 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Unchanged</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="READ_ONLY">Read Only</option>
                </select>
              </label>
              <label className="text-xs text-gray-600">
                Status
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="mt-1 block px-2 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Unchanged</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INVITED">Invited</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <label className="text-xs text-gray-600">
                Construction group
                <select
                  value={bulkGroup}
                  onChange={(e) => setBulkGroup(e.target.value)}
                  className="mt-1 block px-2 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Unchanged</option>
                  <option value="none">None</option>
                  {constructionGroups.map((group) => (
                    <option key={group.id} value={group.id}>{group.code}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleBulkApply}
                disabled={isSubmitting}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleBulkInvite}
                disabled={isSubmitting}
                className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send invitations
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserIds(new Set())}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="overflow-x-auto pb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all accounts"
                    checked={filteredUsers.length > 0 && filteredUsers.every((user) => selectedUserIds.has(user.id))}
                    onChange={toggleAllFiltered}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${user.name || user.email}`}
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
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
                                {!user.emailVerified && (
                                  <button
                                    onClick={() => {
                                      handleSendInvitation(user);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    {user.invitedAt ? 'Resend invitation' : 'Send invitation'}
                                  </button>
                                )}
                                {user.status === 'INVITED' && (
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
                  <option value="">Select access</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="READ_ONLY">Read Only</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Platform access. Organizational roles are assigned on the volunteer record.
                </p>
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
                  <li>• <strong>role</strong> - Platform access: USER, ADMIN, SUPER_ADMIN, or READ_ONLY</li>
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
                    const csvContent = `name,email,role,status
John Doe,john.doe@example.com,USER,ACTIVE
Jane Smith,jane.smith@example.com,ADMIN,ACTIVE
Bob Johnson,bob.johnson@example.com,SUPER_ADMIN,ACTIVE
Alice Williams,alice.williams@example.com,READ_ONLY,INVITED

# Role options: USER, ADMIN, SUPER_ADMIN, READ_ONLY
# Status options: ACTIVE, INVITED, INACTIVE
# Organizational roles are assigned on the volunteer record, not in this file.`;
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
                        const accepted = await toast.confirm(
                          `Send a password reset email to ${selectedUser.email}?`,
                          { confirmLabel: 'Send email', cancelLabel: 'Not now' }
                        );
                        if (!accepted) return;
                        
                        try {
                          const response = await fetch(`/api/v1/admin/users/${selectedUser.id}/reset-password`, {
                            method: 'POST'
                          });
                          
                          if (response.ok) {
                            toast.success('Password reset email sent.');
                          } else {
                            toast.error('Failed to send password reset email.');
                          }
                        } catch (error) {
                          console.error('Failed to send reset email:', error);
                          toast.error('Failed to send password reset email.');
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
