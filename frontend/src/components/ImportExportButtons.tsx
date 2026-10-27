'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, FileText } from 'lucide-react';

interface ImportExportButtonsProps {
  onImport?: (data: any[]) => Promise<void>;
  onExport?: (format: string, filters?: any) => void;
  exportFormats?: ('excel' | 'pdf' | 'csv')[];
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
  }[];
  templateUrl?: string;
  entityName?: string;
}

export default function ImportExportButtons({
  onImport,
  onExport,
  exportFormats = ['excel'],
  filters = [],
  templateUrl,
  entityName = 'items',
}: ImportExportButtonsProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      await onImport(data);
      alert(`Successfully imported ${data.length} ${entityName}`);
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format, selectedFilters);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="flex items-center gap-2">
      {onImport && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </>
      )}

      {templateUrl && (
        <a
          href={templateUrl}
          download
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Download Template
        </a>
      )}

      {onExport && (
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center px-3 py-2 border border-green-300 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Export Options</h3>
              </div>

              {filters.length > 0 && (
                <div className="p-3 border-b border-gray-200 space-y-2">
                  {filters.map((filter) => (
                    <div key={filter.value}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {filter.label}
                      </label>
                      <select
                        value={selectedFilters[filter.value] || ''}
                        onChange={(e) =>
                          setSelectedFilters({
                            ...selectedFilters,
                            [filter.value]: e.target.value,
                          })
                        }
                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="">All</option>
                        {filter.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-2">
                {exportFormats.includes('excel') && (
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Export to Excel
                  </button>
                )}
                {exportFormats.includes('pdf') && (
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2 text-red-600" />
                    Export to PDF
                  </button>
                )}
                {exportFormats.includes('csv') && (
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Export to CSV
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
