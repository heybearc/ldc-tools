'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Download, RefreshCw, Grid3X3, Table, ArrowLeft,
  Users, ChevronDown, ChevronRight, Printer, Copy, UserPlus
} from 'lucide-react';
import DirectoryEntryDialog, { DirectoryEditTarget } from '@/components/DirectoryEntryDialog';

interface OversightAssignment {
  id: string;
  role: string;
  isActive?: boolean;
  awaitingReplacement?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  };
}

interface Crew {
  id: string;
  name: string;
  description: string | null;
  scopeOfWork: string | null;
  isRequired: boolean;
  status: string;
  oversight: OversightAssignment[];
}

interface TradeTeam {
  id: string;
  name: string;
  description: string | null;
  crews: Crew[];
  oversight: OversightAssignment[];
}

type ViewMode = 'grid' | 'table';

export default function TradeTeamsOverviewPage() {
  const [tradeTeams, setTradeTeams] = useState<TradeTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<null | { mode: 'add' } | { mode: 'edit'; entry: DirectoryEditTarget }>(null);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/trade-teams/overview');
      if (!response.ok) throw new Error('Failed to fetch overview data');
      const data = await response.json();
      setTradeTeams(data.tradeTeams || []);
      // Expand all teams by default
      setExpandedTeams(new Set(data.tradeTeams?.map((t: TradeTeam) => t.id) || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const getOversightByRole = (oversight: OversightAssignment[], role: string) => {
    return oversight.filter(o => o.role === role);
  };

  const formatUserName = (user: { name: string | null; email: string }) => {
    return user.name || user.email.split('@')[0];
  };

  const formatUserList = (assignments: OversightAssignment[]) => {
    if (assignments.length === 0) return '—';
    return assignments.map(a => formatUserName(a.user)).join(', ');
  };

  const PersonList = ({
    assignments,
    tradeTeamId,
    crewId,
  }: {
    assignments: OversightAssignment[];
    tradeTeamId: string;
    crewId: string | null;
  }) => {
    if (assignments.length === 0) return <span>—</span>;
    return (
      <div className="flex flex-col gap-1">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              className="flex items-center gap-1.5 min-w-0 text-left hover:underline"
              onClick={() => setEditor({
                mode: 'edit',
                entry: {
                  id: assignment.id,
                  role: assignment.role,
                  startDate: assignment.startDate,
                  endDate: assignment.endDate,
                  tradeTeamId,
                  crewId,
                  user: assignment.user,
                },
              })}
            >
              {assignment.user.image ? (
                <img
                  src={assignment.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover flex-shrink-0 bg-gray-200"
                />
              ) : null}
              <span className={`truncate ${assignment.awaitingReplacement ? 'text-amber-800' : ''}`}>
                {formatUserName(assignment.user)}
                {assignment.awaitingReplacement ? ' (ended)' : ''}
              </span>
            </button>
            {assignment.user.email && (
              <button
                type="button"
                title="Copy email"
                className="text-gray-400 hover:text-gray-700"
                onClick={() => navigator.clipboard.writeText(assignment.user.email)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const exportToCSV = () => {
    const rows: string[][] = [];
    
    // Header row
    rows.push([
      'Trade Team',
      'TTO (Overseer)',
      'TTOA (Assistants)',
      'TT Support',
      'Crew',
      'Discipline/Scope',
      'TCO (Overseer)',
      'TCOA (Assistants)',
      'TC Support'
    ]);

    tradeTeams.forEach(team => {
      const tto = formatUserList(getOversightByRole(team.oversight, 'TTO'));
      const ttoa = formatUserList(getOversightByRole(team.oversight, 'TTOA'));
      const ttSupport = formatUserList(getOversightByRole(team.oversight, 'TT_SUPPORT'));

      if (team.crews.length === 0) {
        rows.push([team.name, tto, ttoa, ttSupport, '', '', '', '', '']);
      } else {
        team.crews.forEach((crew, idx) => {
          const tco = formatUserList(getOversightByRole(crew.oversight, 'TCO'));
          const tcoa = formatUserList(getOversightByRole(crew.oversight, 'TCOA'));
          const tcSupport = formatUserList(getOversightByRole(crew.oversight, 'TC_SUPPORT'));
          
          if (idx === 0) {
            rows.push([team.name, tto, ttoa, ttSupport, crew.name, crew.scopeOfWork || '', tco, tcoa, tcSupport]);
          } else {
            rows.push(['', '', '', '', crew.name, crew.scopeOfWork || '', tco, tcoa, tcSupport]);
          }
        });
      }
    });

    const csvContent = rows.map(row => 
      row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trade-teams-overview-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Trade Teams & Crews Overview', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    const tableData: any[] = [];
    tradeTeams.forEach((team: TradeTeam) => {
      const tto = getOversightByRole(team.oversight, 'TRADE_TEAM_OVERSEER');
      const ttoa = getOversightByRole(team.oversight, 'TRADE_TEAM_OVERSEER_ASSISTANT');
      const support = getOversightByRole(team.oversight, 'TRADE_TEAM_SUPPORT');
      tableData.push([{ content: team.name, colSpan: 5, styles: { fillColor: [219, 234, 254], fontStyle: 'bold' } }]);
      tableData.push(['Team Level', formatUserList(tto), formatUserList(ttoa), formatUserList(support), team.description || '—']);
      team.crews.forEach((crew: Crew) => {
        const tco = getOversightByRole(crew.oversight, 'TRADE_CREW_OVERSEER');
        const tcoa = getOversightByRole(crew.oversight, 'TRADE_CREW_OVERSEER_ASSISTANT');
        const crewSupport = getOversightByRole(crew.oversight, 'TRADE_CREW_SUPPORT');
        tableData.push([`  ${crew.name}`, formatUserList(tco), formatUserList(tcoa), formatUserList(crewSupport), crew.description || '—']);
      });
    });
    autoTable(doc, {
      startY: 28,
      head: [['Trade Team / Crew', 'Overseer', 'Assistants', 'Support', 'Description']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
      
      margin: { left: 10, right: 10, top: 28 }
    });
    doc.save(`trade-teams-overview-${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p>{error}</p>
          <button onClick={fetchOverviewData} className="mt-2 text-red-800 underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const shownTeams = !query
    ? tradeTeams
    : tradeTeams
        .map((team) => {
          const teamHit = team.name.toLowerCase().includes(query);
          const peopleText = (rows: OversightAssignment[]) =>
            rows.some((row) => {
              const haystack = `${row.user.name || ''} ${row.user.email || ''} ${row.role}`.toLowerCase();
              return haystack.includes(query);
            });
          if (teamHit || peopleText(team.oversight)) return team;
          const crews = team.crews.filter(
            (crew) => crew.name.toLowerCase().includes(query) || peopleText(crew.oversight)
          );
          if (crews.length === 0) return null;
          return { ...team, crews };
        })
        .filter((team): team is TradeTeam => team !== null);

  // Color scheme for trade teams (matching spreadsheet style)
  const teamColors = [
    { bg: 'bg-green-600', header: 'bg-green-700', light: 'bg-green-50', border: 'border-green-200' },
    { bg: 'bg-blue-600', header: 'bg-blue-700', light: 'bg-blue-50', border: 'border-blue-200' },
    { bg: 'bg-purple-600', header: 'bg-purple-700', light: 'bg-purple-50', border: 'border-purple-200' },
    { bg: 'bg-orange-600', header: 'bg-orange-700', light: 'bg-orange-50', border: 'border-orange-200' },
    { bg: 'bg-teal-600', header: 'bg-teal-700', light: 'bg-teal-50', border: 'border-teal-200' },
    { bg: 'bg-pink-600', header: 'bg-pink-700', light: 'bg-pink-50', border: 'border-pink-200' },
    { bg: 'bg-indigo-600', header: 'bg-indigo-700', light: 'bg-indigo-50', border: 'border-indigo-200' },
    { bg: 'bg-amber-600', header: 'bg-amber-700', light: 'bg-amber-50', border: 'border-amber-200' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - hidden in print */}
      <div className="bg-white shadow-sm border-b border-gray-200 print:hidden">
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/trade-teams"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Back to Trade Teams</span>
                  <span className="sm:hidden">Back</span>
                </Link>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Trade Teams Overview</h1>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search trade, person, or role"
                  className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={fetchOverviewData}
                  className="p-2 min-h-[44px] min-w-[44px] text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 flex-shrink-0"
                  title="Refresh"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <div className="flex border rounded-lg overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 min-h-[44px] min-w-[44px] ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Grid View"
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 min-h-[44px] min-w-[44px] ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Table View"
                  >
                    <Table className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-2 min-h-[44px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex-shrink-0"
                >
                  <Printer className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="inline-flex items-center px-3 py-2 min-h-[44px] border border-green-300 bg-green-50 text-green-700 text-sm font-medium rounded-md hover:bg-green-100 flex-shrink-0"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
                <button
                  onClick={() => setEditor({ mode: 'add' })}
                  className="inline-flex items-center px-3 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 flex-shrink-0"
                >
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add person</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-3 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center py-4">
        <h1 className="text-2xl font-bold">Trade Teams & Crews Overview</h1>
        <p className="text-sm text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Content */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-auto">
        {viewMode === 'grid' ? (
          /* Grid View - Vertical stack of team cards */
          <div className="space-y-6">
              {shownTeams.map((team, teamIdx) => {
                const colors = teamColors[teamIdx % teamColors.length];
                return (
                  <div key={team.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Trade Team Header */}
                    <div className={`${colors.header} text-white p-3 rounded-t-lg`}>
                      <h2 className="font-bold text-lg text-center">{team.name}</h2>
                    </div>
                    
                    {/* Trade Team Oversight */}
                    <div className={`${colors.light} ${colors.border} border-x p-3`}>
                      <div className="text-xs font-semibold text-gray-500 mb-1">Trade Team Assistant</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="font-medium text-gray-600">Overseer</div>
                          <div className="text-gray-900"><PersonList assignments={getOversightByRole(team.oversight, 'TTO')} tradeTeamId={team.id} crewId={null} /></div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-600">Assistant</div>
                          <div className="text-gray-900"><PersonList assignments={getOversightByRole(team.oversight, 'TTOA')} tradeTeamId={team.id} crewId={null} /></div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-600">Support</div>
                          <div className="text-gray-900"><PersonList assignments={getOversightByRole(team.oversight, 'TT_SUPPORT')} tradeTeamId={team.id} crewId={null} /></div>
                        </div>
                      </div>
                    </div>

                    {/* Crew Header */}
                    <div className={`${colors.bg} text-white p-2`}>
                      <div className="grid grid-cols-4 gap-1 text-xs font-medium">
                        <div>Discipline</div>
                        <div>TCO</div>
                        <div>TCOA</div>
                        <div>Support</div>
                      </div>
                    </div>

                    {/* Crews */}
                    <div className={`${colors.border} border-x border-b rounded-b-lg overflow-hidden`}>
                      {team.crews.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm italic">
                          No crews assigned
                        </div>
                      ) : (
                        team.crews.map((crew, crewIdx) => (
                          <div 
                            key={crew.id} 
                            className={`p-2 text-xs ${crewIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b last:border-b-0`}
                          >
                            <div className="grid grid-cols-4 gap-1">
                              <div className="font-medium text-gray-900" title={crew.scopeOfWork || ''}>
                                {crew.name}
                              </div>
                              <div className="text-gray-700">
                                <PersonList assignments={getOversightByRole(crew.oversight, 'TCO')} tradeTeamId={team.id} crewId={crew.id} />
                              </div>
                              <div className="text-gray-700">
                                <PersonList assignments={getOversightByRole(crew.oversight, 'TCOA')} tradeTeamId={team.id} crewId={crew.id} />
                              </div>
                              <div className="text-gray-700">
                                <PersonList assignments={getOversightByRole(crew.oversight, 'TC_SUPPORT')} tradeTeamId={team.id} crewId={crew.id} />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trade Team
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TTO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TTOA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TT Support
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crew
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TCO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TCOA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TC Support
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shownTeams.map((team, teamIdx) => {
                    const colors = teamColors[teamIdx % teamColors.length];
                    const isExpanded = expandedTeams.has(team.id);
                    
                    return (
                      <React.Fragment key={team.id}>
                        {/* Team Row */}
                        <tr className={`${colors.light} cursor-pointer hover:opacity-80`} onClick={() => toggleTeam(team.id)}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              {isExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                              <span className="font-medium text-gray-900">{team.name}</span>
                              <span className="ml-2 text-xs text-gray-500">({team.crews.length} crews)</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <PersonList assignments={getOversightByRole(team.oversight, 'TTO')} tradeTeamId={team.id} crewId={null} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <PersonList assignments={getOversightByRole(team.oversight, 'TTOA')} tradeTeamId={team.id} crewId={null} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <PersonList assignments={getOversightByRole(team.oversight, 'TT_SUPPORT')} tradeTeamId={team.id} crewId={null} />
                          </td>
                          <td colSpan={4} className="px-4 py-3"></td>
                        </tr>
                        
                        {/* Crew Rows */}
                        {isExpanded && team.crews.map(crew => (
                          <tr key={crew.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-10"></td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-sm text-gray-900">{crew.name}</span>
                                {!crew.isRequired && (
                                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Optional</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              <PersonList assignments={getOversightByRole(crew.oversight, 'TCO')} tradeTeamId={team.id} crewId={crew.id} />
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              <PersonList assignments={getOversightByRole(crew.oversight, 'TCOA')} tradeTeamId={team.id} crewId={crew.id} />
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              <PersonList assignments={getOversightByRole(crew.oversight, 'TC_SUPPORT')} tradeTeamId={team.id} crewId={crew.id} />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Trade Teams</div>
            <div className="text-2xl font-bold text-gray-900">{tradeTeams.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Crews</div>
            <div className="text-2xl font-bold text-gray-900">
              {tradeTeams.reduce((sum, t) => sum + t.crews.length, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Assigned TTOs</div>
            <div className="text-2xl font-bold text-gray-900">
              {tradeTeams.filter(t => getOversightByRole(t.oversight, 'TTO').length > 0).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Assigned TCOs</div>
            <div className="text-2xl font-bold text-gray-900">
              {tradeTeams.reduce((sum, t) => 
                sum + t.crews.filter(c => getOversightByRole(c.oversight, 'TCO').length > 0).length, 0
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
      {editor && (
        <DirectoryEntryDialog
          mode={editor.mode}
          entry={editor.mode === 'edit' ? editor.entry : null}
          teams={tradeTeams.map((team) => ({
            id: team.id,
            name: team.name,
            crews: team.crews.map((crew) => ({ id: crew.id, name: crew.name })),
          }))}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            fetchOverviewData();
          }}
        />
      )}
    </div>
  );
}
