'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Wrench, 
  Calendar, 
  FolderOpen, 
  Settings, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    totalTeams: 0,
    activeProjects: 0,
    upcomingEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [cgInfo, setCgInfo] = useState<{ name: string; regionName: string } | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    
    // Listen for CG filter changes
    const handleCGChange = () => {
      fetchDashboardStats();
    };
    
    window.addEventListener('cg-filter-changed', handleCGChange);
    
    return () => {
      window.removeEventListener('cg-filter-changed', handleCGChange);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      let volunteerCount = 0;
      let teamCount = 0;
      let projectCount = 0;

      // Fetch CG info
      try {
        const cgRes = await fetch('/api/v1/user/cg-info', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (cgRes.ok) {
          const cgData = await cgRes.json();
          setCgInfo(cgData);
        }
      } catch (error) {
        console.error('Error fetching CG info:', error);
      }

      // Fetch volunteers data
      try {
        const volunteersRes = await fetch('/api/v1/volunteers');
        if (volunteersRes.ok) {
          const volunteers = await volunteersRes.json();
          volunteerCount = volunteers.length || 0;
        }
      } catch (error) {
        console.error('Error fetching volunteers:', error);
      }

      // Fetch trade teams data
      try {
        const teamsRes = await fetch('/api/v1/trade-teams');
        if (teamsRes.ok) {
          const teams = await teamsRes.json();
          teamCount = teams.length || 0;
        }
      } catch (error) {
        console.error('Error fetching trade teams:', error);
      }

      // Fetch projects data
      try {
        const projectsRes = await fetch('/api/v1/projects');
        if (projectsRes.ok) {
          const projects = await projectsRes.json();
          // Count only active projects
          projectCount = projects.filter((p: any) => p.isActive && p.status === 'ACTIVE').length || 0;
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }

      setStats({
        totalVolunteers: volunteerCount,
        totalTeams: teamCount,
        activeProjects: projectCount,
        upcomingEvents: 0  // Will be populated when calendar is implemented
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Submit Crew Request',
      description: 'Add volunteers to crews or project rosters',
      href: '/crew-request',
      icon: UserPlus,
      color: 'bg-indigo-500',
      requiresAdmin: false
    },
    {
      title: 'Trade Teams',
      description: 'Manage construction trade teams and crews',
      href: '/trade-teams',
      icon: Wrench,
      color: 'bg-blue-500',
      requiresAdmin: false
    },
    {
      title: 'Volunteers',
      description: 'Personnel directory and volunteer management',
      href: '/volunteers',
      icon: Users,
      color: 'bg-green-500',
      requiresAdmin: false
    },
    {
      title: 'Projects',
      description: 'Project management and assignments',
      href: '/projects',
      icon: FolderOpen,
      color: 'bg-purple-500',
      requiresAdmin: false
    },
    {
      title: 'Calendar',
      description: 'Schedule and event management',
      href: '/calendar',
      icon: Calendar,
      color: 'bg-orange-500',
      requiresAdmin: false
    },
    {
      title: 'Admin',
      description: 'System administration and settings',
      href: '/admin',
      icon: Settings,
      color: 'bg-gray-500',
      requiresAdmin: true
    }
  ];

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const visibleActions = quickActions.filter(action => !action.requiresAdmin || isSuperAdmin);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome to LDC Tools
            </h1>
            <p className="mt-2 text-sm sm:text-lg text-gray-600">
              {cgInfo ? (
                `Construction Group coordination and trade team management for ${cgInfo.regionName}`
              ) : (
                'Construction Group coordination and trade team management'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mb-2 sm:mb-0" />
              <div className="sm:ml-4 text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Volunteers</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalVolunteers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-2 sm:mb-0" />
              <div className="sm:ml-4 text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Trade Teams</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-2 sm:mb-0" />
              <div className="sm:ml-4 text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mb-2 sm:mb-0" />
              <div className="sm:ml-4 text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {visibleActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 sm:p-6 block min-h-[100px] active:bg-gray-50"
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className={`${action.color} p-2.5 sm:p-3 rounded-lg`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h3 className="ml-3 sm:ml-4 text-base sm:text-lg font-semibold text-gray-900">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
