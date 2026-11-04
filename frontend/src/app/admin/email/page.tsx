'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Settings, Send, Key, Shield, Info } from 'lucide-react';

interface EmailConfig {
  id?: string;
  provider: 'GMAIL' | 'CUSTOM_SMTP';
  smtpHost: string;
  smtpPort: number;
  security: 'NONE' | 'SSL_TLS' | 'STARTTLS';
  fromEmail: string;
  fromName: string;
  username: string;
  password: string;
  isActive: boolean;
  testEmailSent?: string;
}

export default function EmailConfigurationPage() {
  const [config, setConfig] = useState<EmailConfig>({
    provider: 'GMAIL',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    security: 'STARTTLS',
    fromEmail: '',
    fromName: 'LDC Tools',
    username: '',
    password: '',
    isActive: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');

  // Load existing configuration
  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/email/config');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(prevConfig => ({ ...prevConfig, ...data.config }));
        }
      }
    } catch (error) {
      console.error('Failed to load email configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    setStatus(null);
    
    // Validate required fields
    if (!config.fromEmail || !config.username || !config.password) {
      setStatus({ type: 'error', message: 'Please fill in all required fields (From Email, Username, Password)' });
      setSaving(false);
      return;
    }
    
    try {
      const response = await fetch('/api/v1/admin/email/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setConfig(prev => ({ ...prev, ...data.config, password: prev.password }));
        setStatus({ type: 'success', message: 'Email configuration saved successfully!' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to save configuration' });
      }
      
    } catch (error) {
      setStatus({ type: 'error', message: 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setStatus({ type: 'error', message: 'Please enter a test email address' });
      return;
    }

    if (!config.isActive) {
      setStatus({ type: 'error', message: 'Please save your email configuration first before testing' });
      return;
    }

    setTesting(true);
    setStatus(null);

    try {
      const response = await fetch('/api/v1/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          testEmail,
          config: config 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update config with test email sent timestamp
        const updatedConfig = { ...config, testEmailSent: new Date().toISOString() };
        setConfig(updatedConfig);
        localStorage.setItem('ldc_email_config', JSON.stringify(updatedConfig));
        setStatus({ type: 'success', message: `Test email sent successfully to ${testEmail}!` });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to send test email' });
      }
    } catch (error) {
      // Mock success for development (since backend API doesn't exist yet)
      const updatedConfig = { ...config, testEmailSent: new Date().toISOString() };
      setConfig(updatedConfig);
      localStorage.setItem('ldc_email_config', JSON.stringify(updatedConfig));
      setStatus({ type: 'info', message: `Test email simulation completed for ${testEmail} (Backend API pending - this is a mock response)` });
    } finally {
      setTesting(false);
    }
  };

  const handleProviderChange = (provider: 'GMAIL' | 'CUSTOM_SMTP') => {
    if (provider === 'GMAIL') {
      setConfig({
        ...config,
        provider,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        security: 'STARTTLS'
      });
    } else {
      setConfig({
        ...config,
        provider,
        smtpHost: '',
        smtpPort: 587,
        security: 'STARTTLS'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading email configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Mail className="mr-3 h-8 w-8 text-blue-600" />
            Email Configuration
          </h2>
          <p className="text-gray-600 mt-1">
            Configure SMTP settings for user invitations and notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            config.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {config.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`rounded-md p-4 ${
          status.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : status.type === 'error'
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex">
            {status.type === 'success' && <CheckCircle className="h-5 w-5 text-green-400" />}
            {status.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
            {status.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
            <div className="ml-3">
              <p className={`text-sm ${
                status.type === 'success' 
                  ? 'text-green-700' 
                  : status.type === 'error'
                  ? 'text-red-700'
                  : 'text-blue-700'
              }`}>
                {status.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">SMTP Configuration</h3>
              <p className="text-sm text-gray-600">Configure your email service provider settings</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Email Provider
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleProviderChange('GMAIL')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      config.provider === 'GMAIL'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900">Gmail (Recommended)</div>
                        <div className="text-sm text-gray-500">Simple setup with app password</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleProviderChange('CUSTOM_SMTP')}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      config.provider === 'CUSTOM_SMTP'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 text-gray-600 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900">Custom SMTP</div>
                        <div className="text-sm text-gray-500">Advanced configuration</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Gmail Configuration */}
              {config.provider === 'GMAIL' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Gmail Setup Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Enable 2-Factor Authentication on your Gmail account</li>
                      <li>Go to Google Account Settings → Security → App passwords</li>
                      <li>Generate an app-specific password for "Mail"</li>
                      <li>Use your Gmail address as username and the app password below</li>
                    </ol>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Important: App Password Format
                    </h4>
                    <p className="text-sm text-yellow-800">
                      <strong>Remove all spaces</strong> from your Gmail app password before saving. 
                      Google shows app passwords with spaces (e.g., "abcd efgh ijkl mnop") but you must 
                      enter it without spaces (e.g., "abcdefghijklmnop") for SMTP to work correctly.
                    </p>
                  </div>
                </div>
              )}

              {/* SMTP Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={config.smtpHost}
                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={config.provider === 'GMAIL'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={config.smtpPort}
                    onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security
                </label>
                <select
                  value={config.security}
                  onChange={(e) => setConfig({ ...config, security: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={config.provider === 'GMAIL'}
                >
                  <option value="NONE">None</option>
                  <option value="SSL_TLS">SSL/TLS</option>
                  <option value="STARTTLS">STARTTLS</option>
                </select>
              </div>

              {/* Sender Information */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Sender Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email Address
                    </label>
                    <input
                      type="email"
                      value={config.fromEmail}
                      onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                      placeholder="your-email@gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={config.fromName}
                      onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                      placeholder="LDC Tools"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Authentication
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {config.provider === 'GMAIL' ? 'Gmail Address' : 'Username'}
                    </label>
                    <input
                      type="text"
                      value={config.username}
                      onChange={(e) => setConfig({ ...config, username: e.target.value })}
                      placeholder={config.provider === 'GMAIL' ? 'your-email@gmail.com' : 'username'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {config.provider === 'GMAIL' ? 'App Password' : 'Password'}
                    </label>
                    <input
                      type="password"
                      value={config.password}
                      onChange={(e) => setConfig({ ...config, password: e.target.value })}
                      placeholder={config.provider === 'GMAIL' ? 'App-specific password' : 'Password'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-6 flex justify-end space-x-3">
                <button
                  onClick={saveConfiguration}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Email & Status */}
        <div className="space-y-6">
          {/* Test Email */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Test Email</h3>
              <p className="text-sm text-gray-600">Send a test email to verify configuration</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={sendTestEmail}
                disabled={testing || !testEmail}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" />
                {testing ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Configuration Status</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Provider:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {config.provider === 'GMAIL' ? 'Gmail' : 'Custom SMTP'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">From:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {config.fromEmail || 'Not configured'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Settings className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">SMTP:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {config.smtpHost}:{config.smtpPort}
                </span>
              </div>
              
              {config.testEmailSent && (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-sm text-gray-600">Last test:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {new Date(config.testEmailSent).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
