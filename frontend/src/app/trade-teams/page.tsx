'use client';

import React, { useState, useEffect } from 'react';
import { Search, Wrench, Settings, AlertCircle, Plus, X, Edit, Trash2, Grid3X3, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { DirectoryAssignment, DirectoryTeam, assignmentsForRole, directoryPersonName } from '@/components/DirectoryTeamCard';

interface OversightStatus {
  tto: { filled: number; required: number };
  ttoa: { filled: number; required: number };
  tts: { filled: number; required: number };
  crews_needing_tco: number;
}

interface TradeTeam {
  id: string;
  name: string;
  description?: string;
  crew_count: number;
  total_members: number;
  active_crews: number;
  is_active: boolean;
  oversight?: OversightStatus;
}

interface TradeTeamsStats {
  total_teams: number;
  total_crews: number;
  active_crews: number;
  inactive_crews: number;
}

interface TradeTeamFormData {
  name: string;
  description: string;
  isActive: boolean;
}

export default function TradeTeamsPage() {
  const { canManageTradeTeams } = usePermissions();
  const [teams, setTeams] = useState<TradeTeam[]>([]);
  const [directoryTeams, setDirectoryTeams] = useState<DirectoryTeam[]>([]);
  const [stats, setStats] = useState<TradeTeamsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TradeTeam | null>(null);
  const [formData, setFormData] = useState<TradeTeamFormData>({
    name: '',
    description: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [response, overviewResponse] = await Promise.all([
        fetch('/api/v1/trade-teams'),
        fetch('/api/v1/trade-teams/overview'),
      ]);
      if (!response.ok) {
        throw new Error(`Failed to fetch trade teams: ${response.statusText}`);
      }
      
      const teamsData = await response.json();
      setTeams(teamsData);
      if (overviewResponse.ok) {
        const overview = await overviewResponse.json();
        setDirectoryTeams(overview.tradeTeams || []);
      }
      
      const calculatedStats: TradeTeamsStats = {
        total_teams: teamsData.length,
        total_crews: teamsData.reduce((sum: number, team: TradeTeam) => sum + team.crew_count, 0),
        active_crews: teamsData.reduce((sum: number, team: TradeTeam) => sum + team.active_crews, 0),
        inactive_crews: teamsData.reduce((sum: number, team: TradeTeam) => sum + (team.crew_count - team.active_crews), 0)
      };
      setStats(calculatedStats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trade teams');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({ name: '', description: '', isActive: true });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (team: TradeTeam) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      isActive: team.is_active
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    setFormData({ name: '', description: '', isActive: true });
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const url = editingTeam 
        ? `/api/v1/trade-teams/${editingTeam.id}`
        : '/api/v1/trade-teams';
      
      const method = editingTeam ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save trade team');
      }

      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save trade team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (team: TradeTeam) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"? This will also delete all crews in this team.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/trade-teams/${team.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete trade team');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trade team');
    }
  };

  const query = searchTerm.trim().toLowerCase();
  const filteredDirectory = !query
    ? directoryTeams
    : directoryTeams.filter((team) => {
        const people = [...team.oversight, ...team.crews.flatMap((crew) => crew.oversight)];
        const personHit = people.some((row) =>
          `${row.user.name || ''} ${row.user.email || ''} ${row.role}`.toLowerCase().includes(query)
        );
        const crewHit = team.crews.some((crew) => crew.name.toLowerCase().includes(query));
        return team.name.toLowerCase().includes(query) || personHit || crewHit;
      });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="font-medium text-lg">Error Loading Trade Teams</h3>
          <p className="mt-2">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center">
            <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Trade Teams</h1>
              <p className="text-sm sm:text-base text-gray-600">Open a team to see its crews and oversight</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:space-x-3">
            <Link href="/trade-teams/overview" className="inline-flex items-center px-4 py-2 min-h-[44px] border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Grid3X3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Directory</span>
            </Link>
            {canManageTradeTeams && (
              <button onClick={openCreateModal} className="inline-flex items-center px-4 py-2 min-h-[44px] border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Trade Team</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-100">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-2 sm:mb-0 sm:mr-3" />
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Teams</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{stats.total_teams}</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 sm:p-6 border border-amber-100">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 mb-2 sm:mb-0 sm:mr-3" />
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-amber-600 font-medium">Total Crews</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-700">{stats.total_crews}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 sm:p-6 border border-green-100">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-2 sm:mb-0 sm:mr-3" />
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-green-600 font-medium">Active Crews</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">{stats.active_crews}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 sm:p-6 border border-red-100">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mb-2 sm:mb-0 sm:mr-3" />
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm text-red-600 font-medium">Inactive Crews</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-700">{stats.inactive_crews}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trade, crew, or person"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.map((team) => {
            const record = teams.find((item) => item.id === team.id);
            const overseer = personLine(assignmentsForRole(team.oversight, 'TTO'));
            return (
              <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <Link href={`/trade-teams/${team.id}`} className="block p-5">
                  <h2 className="text-lg font-semibold text-gray-900">{team.name}</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="text-gray-500">Overseer</span>{' '}
                    <span className="font-medium text-gray-900">{overseer}</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {team.crews.length} crew{team.crews.length === 1 ? '' : 's'}
                  </p>
                </Link>
                {canManageTradeTeams && record && (
                  <div className="flex justify-end gap-1 px-3 pb-3">
                    <button onClick={() => openEditModal(record)} className="p-2 text-gray-400 hover:text-blue-600" title="Edit team">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(record)} className="p-2 text-gray-400 hover:text-red-600" title="Delete team">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredDirectory.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No trade teams found</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first trade team'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTeam ? 'Edit Trade Team' : 'Add Trade Team'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electrical, Mechanical"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingTeam ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function personLine(assignments: DirectoryAssignment[]) {
  if (assignments.length === 0) return '—';
  return assignments
    .map((assignment) => `${directoryPersonName(assignment.user)}${assignment.awaitingReplacement ? ' (ended)' : ''}`)
    .join(', ');
}
