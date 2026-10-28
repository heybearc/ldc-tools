'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, XCircle,
  FileText, Calendar, Tag, UserPlus
} from 'lucide-react';
import DirectoryEntryDialog, { DirectoryEditTarget } from '@/components/DirectoryEntryDialog';
import DirectoryTeamCard, { DirectoryAssignment, DirectoryTeam } from '@/components/DirectoryTeamCard';

interface Crew {
  id: string;
  name: string;
  description: string | null;
  scopeOfWork: string | null;
  isRequired: boolean;
  status: string;
  isActive: boolean;
  tradeTeam: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CrewDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const crewId = params.crewId as string;

  const [crew, setCrew] = useState<Crew | null>(null);
  const [directoryTeams, setDirectoryTeams] = useState<DirectoryTeam[]>([]);
  const [editor, setEditor] = useState<
    | null
    | { mode: 'edit'; entry: DirectoryEditTarget }
    | { mode: 'add' }
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId && crewId) {
      fetchCrew();
      fetchDirectory();
    }
  }, [teamId, crewId]);

  const fetchCrew = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/v1/trade-teams/${teamId}/crews/${crewId}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Crew not found' : 'Failed to fetch crew');
      }
      const data = await response.json();
      setCrew(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load crew');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectory = async () => {
    try {
      const response = await fetch('/api/v1/trade-teams/overview', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setDirectoryTeams(data.tradeTeams || []);
    } catch (err) {
      console.error('Failed to fetch directory:', err);
    }
  };

  const directoryTeam = directoryTeams.find((item) => item.id === teamId) || null;

  const editEntry = (assignment: DirectoryAssignment): DirectoryEditTarget => ({
    id: assignment.id,
    role: assignment.role,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    tradeTeamId: teamId,
    crewId,
    user: assignment.user,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !crew) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="font-medium text-lg">{error || 'Crew not found'}</h3>
          <Link href={`/trade-teams/${teamId}`} className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trade Team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link href={`/trade-teams/${teamId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trade Team
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{crew.name}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                crew.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {crew.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                crew.isRequired ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {crew.isRequired ? 'Required' : 'Optional'}
              </span>
            </div>
            <p className="text-gray-600 mt-1">Part of {crew.tradeTeam?.name || 'Trade Team'}</p>
          </div>
        </div>

        {/* Crew Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-500" />
            Crew Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Status
              </p>
              <p className="font-medium text-gray-900">{crew.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created
              </p>
              <p className="font-medium text-gray-900">
                {crew.createdAt ? new Date(crew.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {crew.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900">{crew.description}</p>
              </div>
            )}
            {crew.scopeOfWork && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Scope of Work</p>
                <p className="text-gray-900">{crew.scopeOfWork}</p>
              </div>
            )}
          </div>
        </div>

        {directoryTeam && (
          <div className="mb-6">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setEditor({ mode: 'add' })}
                className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add person
              </button>
            </div>
            <DirectoryTeamCard
              team={directoryTeam}
              onlyCrewId={crewId}
              onEdit={(assignment) => setEditor({ mode: 'edit', entry: editEntry(assignment) })}
            />
          </div>
        )}

      </div>
      {editor && (
        <DirectoryEntryDialog
          key={editor.mode === 'edit' ? editor.entry.id : 'add'}
          mode={editor.mode}
          entry={editor.mode === 'edit' ? editor.entry : null}
          defaults={{ tradeTeamId: teamId, crewId }}
          teams={directoryTeams.map((item) => ({
            id: item.id,
            name: item.name,
            crews: item.crews.map((crew) => ({ id: crew.id, name: crew.name })),
          }))}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            fetchDirectory();
          }}
        />
      )}
    </div>
  );
}
