'use client';

import { useState, useEffect } from 'react';
import { AdminPageHeader, AdminTableFrame } from '@/components/admin/shell';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  constructionGroupId: string | null;
  linkUrl: string | null;
  targetRoles: string[];
  createdAt: string;
  creator: {
    name: string | null;
    email: string;
  };
  constructionGroup?: {
    name: string;
    code: string;
  };
}

interface ConstructionGroup {
  id: string;
  name: string;
  code: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [constructionGroups, setConstructionGroups] = useState<ConstructionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'URGENT',
    isActive: true,
    startDate: '',
    endDate: '',
    constructionGroupId: '',
    linkUrl: '',
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchConstructionGroups();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/v1/admin/announcements');
      if (response.ok) {
        const result = await response.json();
        setAnnouncements(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConstructionGroups = async () => {
    try {
      const response = await fetch('/api/v1/construction-groups');
      if (response.ok) {
        const result = await response.json();
        setConstructionGroups(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch construction groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      constructionGroupId: formData.constructionGroupId || null,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      linkUrl: formData.linkUrl.trim() || null,
      targetRoles: [],
    };

    if (payload.linkUrl) {
      try {
        const url = new URL(payload.linkUrl);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
          alert('The link must start with https://');
          return;
        }
      } catch {
        alert('Enter a full web link, starting with https://');
        return;
      }
    }

    try {
      const url = editingId
        ? `/api/v1/admin/announcements/${editingId}`
        : '/api/v1/admin/announcements';
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchAnnouncements();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save announcement');
      }
    } catch (error) {
      console.error('Save announcement error:', error);
      alert('Failed to save announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      isActive: announcement.isActive,
      startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
      endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
      constructionGroupId: announcement.constructionGroupId || '',
      linkUrl: announcement.linkUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`/api/v1/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAnnouncements();
      } else {
        alert('Failed to delete announcement');
      }
    } catch (error) {
      console.error('Delete announcement error:', error);
      alert('Failed to delete announcement');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      message: '',
      type: 'INFO',
      isActive: true,
      startDate: '',
      endDate: '',
      constructionGroupId: '',
      linkUrl: '',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatWindow = (announcement: Announcement) => {
    if (!announcement.startDate && !announcement.endDate) return 'Always';
    const fmt = (value: string) =>
      new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    const start = announcement.startDate ? fmt(announcement.startDate) : 'Open';
    const end = announcement.endDate ? fmt(announcement.endDate) : 'Open';
    return `${start} – ${end}`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description="Manage site-wide and construction-group announcements"
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex min-h-[40px] w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            New Announcement
          </button>
        }
      />

      <AdminTableFrame>
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Type</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:table-cell">Scope</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 md:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 lg:table-cell">Dates</th>
                <th className="sticky right-0 bg-gray-50 px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {announcements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                  No announcements yet. Create your first announcement.
                </td>
              </tr>
            ) : (
              announcements.map((announcement) => (
                <tr key={announcement.id} className="group hover:bg-gray-50">
                  <td className="w-full max-w-0 px-4 py-3">
                    <div className="truncate text-sm font-medium text-gray-900">{announcement.title}</div>
                    <div className="truncate text-sm text-gray-500">{announcement.message}</div>
                    {announcement.linkUrl && (
                      <div className="truncate text-xs text-blue-700">{announcement.linkUrl}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${getTypeColor(announcement.type)}`}>
                      {announcement.type}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 sm:table-cell">
                    {announcement.constructionGroup
                      ? announcement.constructionGroup.code || announcement.constructionGroup.name
                      : 'Global'}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${
                      announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {announcement.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 lg:table-cell">
                    {formatWindow(announcement)}
                  </td>
                  <td className="sticky right-0 bg-white px-4 py-3 text-right text-sm font-medium group-hover:bg-gray-50">
                    <div className="inline-flex gap-3 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableFrame>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div>
                <label htmlFor="announcement-link" className="block text-sm font-medium text-gray-700 mb-1">Web link (optional)</label>
                <input
                  id="announcement-link"
                  type="url"
                  inputMode="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">Shown as a link under the message. Leave blank for no link.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Construction Group</label>
                  <select
                    value={formData.constructionGroupId}
                    onChange={(e) => setFormData({ ...formData, constructionGroupId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Global (whole app)</option>
                    {constructionGroups.map(cg => (
                      <option key={cg.id} value={cg.id}>{cg.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Global reaches everyone. A construction group reaches only that group.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'} Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
