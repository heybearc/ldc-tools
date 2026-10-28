'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, Users, ArrowLeft, Edit, Trash2, Plus, X, 
  CheckCircle, AlertCircle, Settings, Eye, Building2
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface Crew {
  id: string;
  name: string;
  description: string;
  status: string;
  member_count: number;
  is_active: boolean;
}

interface TradeTeam {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  crew_count: number;
  total_members: number;
  crews: Crew[];
  created_at: string;
  updated_at: string;
}

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  congregation?: string;
  trade_team_name?: string;
}

interface CrewFormData {
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export default function TradeTeamDetailPage() {
  const { canManageTradeTeams } = usePermissions();
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TradeTeam | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit team modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', isActive: true });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Add crew modal
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);
  const [crewFormData, setCrewFormData] = useState<CrewFormData>({
    name: '',
    description: '',
    status: 'ACTIVE'
  });
  const [isCrewSubmitting, setIsCrewSubmitting] = useState(false);
  const [crewFormError, setCrewFormError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      fetchTeam();
      fetchTeamVolunteers();
    }
  }, [teamId]);

  const fetchTeamVolunteers = async () => {
    try {
      const res = await fetch('/api/v1/volunteers');
      if (res.ok) {
        const data = await res.json();
        const allVolunteers = Array.isArray(data) ? data : (data.volunteers || []);
        // Filter to volunteers assigned to this team's crews or with trade team level roles
        const teamVolunteers = allVolunteers.filter((v: Volunteer) => 
          v.trade_team_name === team?.name || 
          ['Trade Team Overseer', 'Trade Team Overseer Assistant', 'Trade Team Support'].includes(v.role)
        );
        setVolunteers(teamVolunteers);
      }
    } catch (err) {
      console.error('Failed to fetch volunteers:', err);
    }
  };

  // Re-fetch volunteers when team loads
  useEffect(() => {
    if (team) {
      fetchTeamVolunteers();
    }
  }, [team?.name]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/v1/trade-teams/${teamId}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Trade team not found' : 'Failed to fetch trade team');
      }
      const data = await response.json();
      setTeam(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trade team');
    } finally {
      setLoading(false);
    }
  };

  // Group volunteers by role
  const overseers = volunteers.filter(v => v.role === 'Trade Team Overseer');
  const assistants = volunteers.filter(v => v.role === 'Trade Team Overseer Assistant');
  const support = volunteers.filter(v => v.role === 'Trade Team Support');

  const openEditModal = () => {
    if (team) {
      setEditFormData({
        name: team.name,
        description: team.description || '',
        isActive: team.is_active
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      const response = await fetch(`/api/v1/trade-teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (response.ok) {
        fetchTeam();
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to update team:', err);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const openCrewModal = (crew?: Crew) => {
    if (crew) {
      setEditingCrew(crew);
      setCrewFormData({
        name: crew.name,
        description: crew.description || '',
        status: crew.status.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'PENDING'
      });
    } else {
      setEditingCrew(null);
      setCrewFormData({ name: '', description: '', status: 'ACTIVE' });
    }
    setCrewFormError(null);
    setIsCrewModalOpen(true);
  };

  const handleCrewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCrewSubmitting(true);
    setCrewFormError(null);
    try {
      const url = editingCrew 
        ? `/api/v1/trade-teams/${teamId}/crews/${editingCrew.id}`
        : `/api/v1/trade-teams/${teamId}/crews`;
      const response = await fetch(url, {
        method: editingCrew ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crewFormData),
      });
      if (response.ok) {
        fetchTeam();
        setIsCrewModalOpen(false);
      } else {
        const data = await response.json();
        setCrewFormError(data.error || 'Failed to save crew');
      }
    } catch (err) {
      setCrewFormError('Failed to save crew');
    } finally {
      setIsCrewSubmitting(false);
    }
  };

  const handleDeleteCrew = async (crew: Crew) => {
    if (!confirm(`Delete crew "${crew.name}"?`)) return;
    try {
      const response = await fetch(`/api/v1/trade-teams/${teamId}/crews/${crew.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchTeam();
      }
    } catch (err) {
      console.error('Failed to delete crew:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="font-medium text-lg">{error || 'Trade team not found'}</h3>
          <Link href="/trade-teams" className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trade Teams
          </Link>
        </div>
      </div>
    );
  }

  const activeCrews = team.crews.filter(c => c.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link href="/trade-teams" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trade Teams
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {team.name}
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  team.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {team.is_active ? 'Active' : 'Inactive'}
                </span>
              </h1>
              {team.description && (
                <p className="text-gray-600 mt-1">{team.description}</p>
              )}
            </div>
          </div>
          {canManageTradeTeams && (
            <button onClick={openEditModal} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Edit className="h-4 w-4 mr-2" />
              Edit Team
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Crews</p>
                <p className="text-2xl font-bold text-gray-900">{team.crew_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Active Crews</p>
                <p className="text-2xl font-bold text-gray-900">{activeCrews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Team Oversight */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              Trade Team Oversight ({overseers.length + assistants.length + support.length})
            </h2>
            {canManageTradeTeams && (
              <Link 
                href="/trade-teams/overview" 
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add in Directory
              </Link>
            )}
          </div>

          {/* Overseers */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                Trade Team Overseer
              </span>
              <span className="text-sm text-gray-500">({overseers.length}/1)</span>
            </div>
            {overseers.length > 0 ? (
              <div className="space-y-2">
                {overseers.map(v => (
                  <VolunteerCard key={v.id} volunteer={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic ml-2">No Trade Team Overseer assigned</p>
            )}
          </div>

          {/* Assistants */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Trade Team Overseer Assistant
              </span>
              <span className="text-sm text-gray-500">({assistants.length}/2)</span>
            </div>
            {assistants.length > 0 ? (
              <div className="space-y-2">
                {assistants.map(v => (
                  <VolunteerCard key={v.id} volunteer={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic ml-2">No Trade Team Overseer Assistant assigned</p>
            )}
          </div>

          {/* Support */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                Trade Team Support
              </span>
            </div>
            {support.length > 0 ? (
              <div className="space-y-2">
                {support.map(v => (
                  <VolunteerCard key={v.id} volunteer={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic ml-2">No Trade Team Support assigned</p>
            )}
          </div>
        </div>

        {/* Crews */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-500" />
              Crews
            </h2>
            {canManageTradeTeams && (
              <button
                onClick={() => openCrewModal()}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Crew
              </button>
            )}
          </div>

          {team.crews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No crews yet. Add your first crew to get started.</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {team.crews.map((crew) => (
                <div key={crew.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{crew.name}</h3>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        crew.status.toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        crew.status.toUpperCase() === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {crew.status}
                      </span>
                    </div>
                    {crew.description && (
                      <p className="text-sm text-gray-500 mt-1">{crew.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/trade-teams/${teamId}/crews/${crew.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded"
                      title="View Crew Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {canManageTradeTeams && (
                      <>
                        <button
                          onClick={() => openCrewModal(crew)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded"
                          title="Edit Crew"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCrew(crew)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded"
                          title="Delete Crew"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Team Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Trade Team</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isEditSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isEditSubmitting ? 'Saving...' : 'Update Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Crew Modal */}
      {isCrewModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingCrew ? 'Edit Crew' : 'Add Crew'}
              </h3>
              <button onClick={() => setIsCrewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {crewFormError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {crewFormError}
              </div>
            )}
            <form onSubmit={handleCrewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crew Name *</label>
                <input
                  type="text"
                  required
                  value={crewFormData.name}
                  onChange={(e) => setCrewFormData({ ...crewFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Crew A, Morning Shift"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={crewFormData.description}
                  onChange={(e) => setCrewFormData({ ...crewFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={crewFormData.status}
                  onChange={(e) => setCrewFormData({ ...crewFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'PENDING' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsCrewModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isCrewSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isCrewSubmitting ? 'Saving...' : editingCrew ? 'Update Crew' : 'Add Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VolunteerCard({ volunteer }: { volunteer: Volunteer }) {
  const initials = `${volunteer.first_name?.[0] || ''}${volunteer.last_name?.[0] || ''}`;
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-medium">{initials || '?'}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {volunteer.first_name || ''} {volunteer.last_name || ''}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {volunteer.congregation && (
              <span className="flex items-center">
                <Building2 className="h-3 w-3 mr-1" />
                {volunteer.congregation}
              </span>
            )}
            {volunteer.phone && <span>• {volunteer.phone}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
