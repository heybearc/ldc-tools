'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, ArrowLeft, XCircle,
  FileText, Calendar, Tag, UserPlus, Building2
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

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

interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  email_jw?: string;
  congregation?: string;
  is_overseer: boolean;
  is_assistant: boolean;
}

export default function CrewDetailPage() {
  const { canManageTradeTeams } = usePermissions();
  const params = useParams();
  const teamId = params.id as string;
  const crewId = params.crewId as string;

  const [crew, setCrew] = useState<Crew | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId && crewId) {
      fetchCrew();
      fetchCrewVolunteers();
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

  const fetchCrewVolunteers = async () => {
    try {
      const response = await fetch(`/api/v1/volunteers?crewId=${crewId}`);
      if (response.ok) {
        const data = await response.json();
        setVolunteers(Array.isArray(data) ? data : (data.volunteers || []));
      }
    } catch (err) {
      console.error("Failed to fetch crew volunteers:", err); console.log("Crew ID used:", crewId);
    }
  };

  // Group volunteers by organizational role type
  const overseers = volunteers.filter(v => 
    v.roles?.some(r => r.roleCode === 'TCO' && r.crewId === crewId)
  );
  const assistants = volunteers.filter(v => 
    v.roles?.some(r => r.roleCode === 'TCOA' && r.crewId === crewId)
  );
  const support = volunteers.filter(v => 
    v.roles?.some(r => r.roleCode === 'TC-Support' && r.crewId === crewId)
  );

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

        {/* Crew Oversight Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              Crew Oversight ({overseers.length + assistants.length + support.length})
            </h2>
            {canManageTradeTeams && (
              <Link 
                href="/trade-teams/overview" 
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add in Directory
              </Link>
            )}
          </div>

          {/* Overseers */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                Trade Crew Overseer
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
              <p className="text-sm text-gray-500 italic ml-2">No Trade Crew Overseer assigned</p>
            )}
          </div>

          {/* Assistants */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Trade Crew Overseer Assistant
              </span>
              <span className="text-sm text-gray-500">({assistants.length}/3)</span>
            </div>
            {assistants.length > 0 ? (
              <div className="space-y-2">
                {assistants.map(v => (
                  <VolunteerCard key={v.id} volunteer={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic ml-2">No Trade Crew Overseer Assistant assigned</p>
            )}
          </div>

          {/* Support */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                Trade Crew Support
              </span>
            </div>
            {support.length > 0 ? (
              <div className="space-y-2">
                {support.map(v => (
                  <VolunteerCard key={v.id} volunteer={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic ml-2">No Trade Crew Support assigned</p>
            )}
          </div>
        </div>

      </div>
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
