'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Shield, Users, Mail, Activity, BarChart, FileText, Settings, 
  CheckCircle, AlertCircle, TrendingUp, Clock, MessageSquare,
  UserCheck, UserX, UserPlus, Database, Server
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    invited: number;
    inactive: number;
  };
  feedback: {
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
  };
  system: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    version: string;
    lastBackup: string | null;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: 'login' | 'update' | 'create' | 'delete';
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const adminModules = useMemo(() => [
    { name: 'User Management', href: '/admin/users', icon: Users, color: 'blue' },
    { name: 'Email Config', href: '/admin/email', icon: Mail, color: 'green' },
    { name: 'Health Monitor', href: '/admin/health', icon: Activity, color: 'emerald' },
    { name: 'API Status', href: '/admin/api', icon: BarChart, color: 'purple' },
    { name: 'Audit Logs', href: '/admin/audit', icon: FileText, color: 'orange' },
    { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare, color: 'pink' },
    { name: 'System Ops', href: '/admin/system', icon: Settings, color: 'gray' },
  ], []);

  const loadDashboardData = useCallback(async () => {
    try {
      // Fetch user stats
      const userStatsRes = await fetch('/api/v1/admin/users/stats');
      const userStats = userStatsRes.ok ? await userStatsRes.json() : null;

      // Fetch feedback stats
      const feedbackRes = await fetch('/api/v1/admin/feedback?limit=0');
      const feedbackData = feedbackRes.ok ? await feedbackRes.json() : null;

      // Fetch system info
      const systemRes = await fetch('/api/v1/admin/system/info');
      const systemData = systemRes.ok ? await systemRes.json() : null;

      // Fetch recent audit logs
      const auditRes = await fetch('/api/v1/admin/audit/logs?limit=5');
      const auditData = auditRes.ok ? await auditRes.json() : null;

      // Fetch backup info
      const backupRes = await fetch('/api/v1/admin/backup/info');
      const backupData = backupRes.ok ? await backupRes.json() : null;

      // Calculate feedback stats
      const feedbackStats = feedbackData?.feedback || [];
      const newFeedback = feedbackStats.filter((f: any) => f.status === 'NEW').length;
      const inProgressFeedback = feedbackStats.filter((f: any) => f.status === 'IN_PROGRESS').length;
      const resolvedFeedback = feedbackStats.filter((f: any) => f.status === 'RESOLVED' || f.status === 'CLOSED').length;

      setStats({
        users: {
          total: userStats?.stats?.total || 0,
          active: userStats?.stats?.active || 0,
          invited: userStats?.stats?.invited || 0,
          inactive: userStats?.stats?.inactive || 0,
        },
        feedback: {
          total: feedbackStats.length,
          new: newFeedback,
          inProgress: inProgressFeedback,
          resolved: resolvedFeedback,
        },
        system: {
          status: 'healthy',
          uptime: systemData?.systemInfo?.uptime || 'Unknown',
          version: systemData?.systemInfo?.version || '1.2.0',
          lastBackup: backupData?.lastBackup?.date || null,
        },
        recentActivity: (auditData?.logs || []).slice(0, 5).map((log: any) => ({
          id: log.id,
          action: log.action,
          user: log.userName || 'System',
          timestamp: log.timestamp,
          type: log.action.toLowerCase().includes('login') ? 'login' : 
                log.action.toLowerCase().includes('create') ? 'create' :
                log.action.toLowerCase().includes('delete') ? 'delete' : 'update'
        })),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-blue-100">
          Welcome to the LDC Tools Admin Control Center. Monitor system health, manage users, and oversee operations.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="flex items-center">
            <Server className="h-4 w-4 mr-1" />
            Version {stats?.system.version}
          </span>
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Uptime: {stats?.system.uptime}
          </span>
          {stats?.system.lastBackup && (
            <span className="flex items-center">
              <Database className="h-4 w-4 mr-1" />
              Last backup: {formatTimeAgo(stats.system.lastBackup)}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <Link href="/admin/users" className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow active:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.users.total || 0}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 text-xs sm:text-sm">
            <span className="flex items-center text-green-600 sm:mr-3">
              <UserCheck className="h-4 w-4 mr-1" />
              {stats?.users.active || 0} active
            </span>
            <span className="flex items-center text-yellow-600">
              <UserPlus className="h-4 w-4 mr-1" />
              {stats?.users.invited || 0} invited
            </span>
          </div>
        </Link>

        {/* Feedback Card */}
        <Link href="/admin/feedback" className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow active:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">Feedback</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.feedback.total || 0}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {(stats?.feedback.new || 0) > 0 && (
              <span className="flex items-center text-red-600 mr-3">
                <AlertCircle className="h-4 w-4 mr-1" />
                {stats?.feedback.new} new
              </span>
            )}
            <span className="flex items-center text-blue-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              {stats?.feedback.inProgress || 0} in progress
            </span>
          </div>
        </Link>

        {/* System Health Card */}
        <Link href="/admin/health" className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow active:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">System Health</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 capitalize">{stats?.system.status || 'Unknown'}</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            All systems operational
          </div>
        </Link>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-medium text-gray-500">Quick Actions</p>
            <Settings className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <Link 
              href="/admin/users#invite-user" 
              className="block w-full text-left px-3 py-2 min-h-[44px] flex items-center text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors active:bg-blue-200"
            >
              + Invite User
            </Link>
            <Link 
              href="/admin/system" 
              className="block w-full text-left px-3 py-2 min-h-[44px] flex items-center text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors active:bg-gray-200"
            >
              System Operations
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/admin/audit" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'login' ? 'bg-green-100' :
                    activity.type === 'create' ? 'bg-blue-100' :
                    activity.type === 'delete' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {activity.type === 'login' ? <UserCheck className="h-4 w-4 text-green-600" /> :
                     activity.type === 'create' ? <UserPlus className="h-4 w-4 text-blue-600" /> :
                     activity.type === 'delete' ? <UserX className="h-4 w-4 text-red-600" /> :
                     <FileText className="h-4 w-4 text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>

        {/* Admin Modules */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Modules</h2>
          <div className="grid grid-cols-2 gap-3">
            {adminModules.map((module) => (
              <Link
                key={module.name}
                href={module.href}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <module.icon className={`h-5 w-5 mr-3 text-${module.color}-600`} />
                <span className="text-sm font-medium text-gray-700">{module.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
