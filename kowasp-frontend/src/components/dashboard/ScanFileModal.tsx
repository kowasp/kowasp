import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import apiClient from '../../lib/api';
import { ModernModal } from './ModernModal';

interface ScanResult {
  summary?: {
    totalIssues: number;
    severityBreakdown?: Record<string, number>;
    filesAnalyzed?: number;
  };
  findings?: Array<any>;
  recommendations?: string[];
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

export function ScanFileModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiClient.post('/scans/code', { code });
      setResult(res.data);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError?.response?.data?.message || apiError.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernModal open={open} onClose={onClose} title="Scan Code File">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-black">Code to Scan</label>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <MonacoEditor
              height="300px"
              defaultLanguage="javascript"
              value={code}
              onChange={value => setCode(value || '')}
              options={{ 
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
              theme="vs-light"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleScan} 
            disabled={loading || !code}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scan Code
              </>
            )}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-black rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Results</h3>
              
              {result.summary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6">
                  {/* Summary content here */}
                </div>
              )}

              {result.findings && result.findings.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-black">Findings</h4>
                  {result.findings.map((finding, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      {/* Finding content here */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModernModal>
  );
} 