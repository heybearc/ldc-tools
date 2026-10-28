'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import OversightSection from '@/components/oversight/OversightSection';
import { PERSONNEL_CONTACT_CONFIG, CG_STAFF_CONFIG, REGIONAL_STAFF_CONFIG } from '@/lib/oversight-types';
import { Building2, ArrowLeft, Users, Wrench, MapPin, Calendar, AlertCircle, RefreshCw, Save, ExternalLink } from "lucide-react";

interface ConstructionGroup {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  region: {
    id: string;
    code: string;
    name: string;
    zone?: {
      id: string;
      code: string;
      name: string;
      branch?: {
        id: string;
        code: string;
        name: string;
      };
    };
  };
  _count: {
    users: number;
    tradeTeams: number;
    crews: number;
    projects: number;
  };
  createdAt: string;
}

export default function ConstructionGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cgId = params.cgId as string;

  const [cg, setCg] = useState<ConstructionGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string; name: string | null; email: string}>>([]);
  const [cgProjectUrl, setCgProjectUrl] = useState<string>("");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    if (cgId) {
      fetchCG();
      fetchUsers();
    }
  }, [cgId]);

  const fetchCG = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/construction-groups/${cgId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Construction Group not found');
        }
        throw new Error('Failed to fetch Construction Group');
      }

      const data = await response.json();
      setCg(data);
      setCgProjectUrl(data.cgProjectUrl || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Construction Group');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCGUrl = async () => {
    setSavingUrl(true);
    try {
      const response = await fetch(`/api/v1/construction-groups/${cgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cgProjectUrl: cgProjectUrl || null }),
      });
      if (response.ok) {
        const updated = await response.json();
        setCg(updated);
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSavingUrl(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/users');
      if (res.ok) {
        const data = await res.json();
        // Filter for active users only
        const activeUsers = (data.users || []).filter((u: any) => u.status === 'ACTIVE');
        setAvailableUsers(activeUsers);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !cg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="font-medium text-lg">{error || 'Construction Group not found'}</h3>
          <Link
            href="/admin/organization"
            className="mt-4 inline-flex items-center text-red-700 hover:text-red-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organization
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link
              href="/admin/organization"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Organization
            </Link>
            
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <Building2 className="h-10 w-10 text-orange-600 mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    {cg.name}
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cg.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">{cg.code}</span>
                    <span>•</span>
                    <MapPin className="h-4 w-4" />
                    {cg.region?.zone?.branch?.name} → {cg.region?.zone?.name} → {cg.region?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Users</h3>
                <p className="text-2xl font-bold text-gray-900">{cg._count?.users || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Trade Teams</h3>
                <p className="text-2xl font-bold text-gray-900">{cg._count?.tradeTeams || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Crews</h3>
                <p className="text-2xl font-bold text-gray-900">{cg._count?.crews || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Construction Group Staff Section */}
        <OversightSection
          title="Construction Group Staff"
          entityId={cgId}
          apiBasePath={`/api/v1/construction-groups/${cgId}/cg-staff`}
          roleConfig={CG_STAFF_CONFIG}
          roleOrder={['CGO', 'CGOA', 'CG_SECRETARY', 'CG_SAFETY']}
          availableUsers={availableUsers}
        />

        {/* Personnel Contacts Section */}
        <OversightSection
          title="Personnel Contacts"
          entityId={cgId}
          apiBasePath={`/api/v1/construction-groups/${cgId}/personnel-contacts`}
          roleConfig={PERSONNEL_CONTACT_CONFIG}
          roleOrder={['PC', 'PCA', 'PC_SUPPORT']}
          availableUsers={availableUsers}
        />

        {/* Regional Staff Section */}
        <OversightSection
          title="Regional Staff"
          entityId={cg.region?.id || cgId}
          apiBasePath={`/api/v1/regions/${cg.region?.id}/regional-staff`}
          roleConfig={REGIONAL_STAFF_CONFIG}
          roleOrder={['ZO', 'ZOA', 'RO', 'ROA']}
          availableUsers={availableUsers}
        />

        {/* Description */}
        {cg.description && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600">{cg.description}</p>
          </div>
        )}

        {/* CG Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Construction Group Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Builder Assistant Project URL
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Enter the URL to this Construction Group's Builder Assistant project. This link is used in crew request workflow instructions.
              </p>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={cgProjectUrl}
                  onChange={(e) => setCgProjectUrl(e.target.value)}
                  placeholder="https://www.jw.org/en/volunteer/ldc/..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSaveCGUrl}
                  disabled={savingUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingUrl ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
              {cgProjectUrl && (
                <a
                  href={cgProjectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Test this link
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/trade-teams"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Wrench className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium">Trade Teams</p>
                <p className="text-sm text-gray-500">Manage trade teams and crews</p>
              </div>
            </Link>
            <Link
              href="/trade-teams/overview"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium">Directory</p>
                <p className="text-sm text-gray-500">Trade and crew leadership</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Created: {new Date(cg.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
