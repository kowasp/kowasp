"use client";

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'next/navigation';
import MonacoEditor from '@monaco-editor/react';

interface Project {
  _id: string;
  name: string;
  repositoryUrl: string;
  createdAt: string;
}

interface ScanResult {
  summary?: {
    totalIssues: number;
    severityBreakdown?: Record<string, number>;
    filesAnalyzed?: number;
  };
  findings?: Array<{
    static?: {
      severity?: string;
      rule?: string;
      description?: string;
      location?: {
        file: string;
        line: number;
      };
      context?: string;
      code?: string;
      remediation?: string;
    };
    llm?: {
      isVulnerable?: boolean;
      confidence?: number;
      explanation?: string;
      remediation?: string;
      codeExample?: string;
    };
  }>;
  recommendations?: string[];
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Modern Modal Component
function ModernModal({ open, onClose, title, children }: { 
  open: boolean; 
  onClose: () => void; 
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function ScanFileModal({ open, onClose }: { open: boolean, onClose: () => void }) {
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
              
              {/* Summary */}
              {result.summary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.summary.totalIssues}</div>
                      <div className="text-sm text-blue-700">Total Issues</div>
                    </div>
                    {result.summary.filesAnalyzed !== undefined && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{result.summary.filesAnalyzed}</div>
                        <div className="text-sm text-blue-700">Files Analyzed</div>
                      </div>
                    )}
                    {result.summary.severityBreakdown && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Object.keys(result.summary.severityBreakdown).length}
                        </div>
                        <div className="text-sm text-blue-700">Severity Levels</div>
                      </div>
                    )}
                  </div>
                  
                  {result.summary.severityBreakdown && (
                    <div className="flex gap-3 mt-4">
                      {Object.entries(result.summary.severityBreakdown).map(([sev, count]) => (
                        <span 
                          key={sev} 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            sev === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : sev === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {sev}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Findings */}
              {result.findings && result.findings.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-black">Findings</h4>
                  {result.findings.map((finding, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      {/* Static fields */}
                      {finding.static && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            {finding.static.severity && (
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                finding.static.severity === 'high' 
                                  ? 'bg-red-100 text-red-800' 
                                  : finding.static.severity === 'medium' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {finding.static.severity}
                              </span>
                            )}
                            {finding.static.rule && (
                              <h5 className="font-semibold text-black">{finding.static.rule}</h5>
                            )}
                          </div>
                          
                          {finding.static.description && (
                            <p className="text-black">{finding.static.description}</p>
                          )}
                          
                          {finding.static.location && (
                            <div className="flex items-center gap-2 text-sm text-black">
                              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {finding.static.location.file}:{finding.static.location.line}
                            </div>
                          )}
                          
                          {finding.static.context && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-sm text-black"><strong>Context:</strong> {finding.static.context}</p>
                            </div>
                          )}
                          
                          {finding.static.code && (
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                              <pre className="text-sm"><code>{finding.static.code}</code></pre>
                            </div>
                          )}
                          
                          {finding.static.remediation && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800"><strong>Remediation:</strong> {finding.static.remediation}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* LLM fields */}
                      {finding.llm && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="font-semibold text-purple-900 mb-3">AI Analysis</div>
                          <div className="space-y-2 text-sm">
                            {finding.llm.isVulnerable !== undefined && (
                              <p><strong>Vulnerable:</strong> 
                                <span className={finding.llm.isVulnerable ? 'text-red-600' : 'text-green-600'}>
                                  {finding.llm.isVulnerable ? ' Yes' : ' No'}
                                </span>
                              </p>
                            )}
                            {finding.llm.confidence !== undefined && (
                              <p><strong>Confidence:</strong> {finding.llm.confidence}%</p>
                            )}
                            {finding.llm.explanation && (
                              <p><strong>Explanation:</strong> {finding.llm.explanation}</p>
                            )}
                            {finding.llm.remediation && (
                              <p><strong>Remediation:</strong> {finding.llm.remediation}</p>
                            )}
                            {finding.llm.codeExample && (
                              <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto mt-2">
                                <pre className="text-sm"><code>{finding.llm.codeExample}</code></pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-800">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModernModal>
  );
}

function ScanDirectoryModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadType, setUploadType] = useState<'zip' | 'directory'>('directory');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      
      if (uploadType === 'zip') {
        formData.append('zip', files[0]);
        const res = await apiClient.post('/scans/upload-directory', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult(res.data);
      } else {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          formData.append('files', file, file.webkitRelativePath || file.name);
        }
        const res = await apiClient.post('/scans/upload-directory-files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult(res.data);
      }
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError?.response?.data?.message || apiError.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  return (
    <ModernModal open={open} onClose={onClose} title="Scan Directory">
      <div className="space-y-6">
        {/* Upload type selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black">Upload Type</label>
          <div className="flex gap-4">
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="directory"
                checked={uploadType === 'directory'}
                onChange={(e) => setUploadType(e.target.value as 'zip' | 'directory')}
                className="mr-3 text-blue-600"
              />
              <div>
                <div className="font-medium text-black">Directory Upload</div>
                <div className="text-sm text-black">Select multiple files from a directory</div>
              </div>
            </label>
            <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="zip"
                checked={uploadType === 'zip'}
                onChange={(e) => setUploadType(e.target.value as 'zip' | 'directory')}
                className="mr-3 text-blue-600"
              />
              <div>
                <div className="font-medium text-black">ZIP Upload</div>
                <div className="text-sm text-black">Upload a ZIP file containing your project</div>
              </div>
            </label>
          </div>
        </div>

        {/* File input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-black">
            {uploadType === 'zip' ? 'ZIP File' : 'Project Files'}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              multiple={uploadType === 'directory'}
              accept={uploadType === 'zip' ? '.zip' : undefined}
              {...(uploadType === 'directory' ? { webkitdirectory: '' } : {})}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg className="mx-auto h-12 w-12 text-black mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-black font-medium mb-2">
                {uploadType === 'zip' ? 'Click to upload ZIP file' : 'Click to select directory'}
              </div>
              <div className="text-sm text-black">
                {uploadType === 'zip' ? 'or drag and drop' : 'or drag and drop files'}
              </div>
            </label>
          </div>
          {files && (
            <div className="text-sm text-black">
              {uploadType === 'zip' 
                ? `Selected: ${files[0]?.name}` 
                : `${files.length} files selected`
              }
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleScan} 
            disabled={loading || !files || files.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                Scan Directory
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
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-black mb-4">Scan Results</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <pre className="text-sm overflow-x-auto text-black">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </ModernModal>
  );
}

export default function DashboardPage() {
  const { token, hydrated } = useAuthStore();
  const router = useRouter();
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanDirModalOpen, setScanDirModalOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects').then(res => res.data),
    enabled: hydrated && !!token,
  });

  useEffect(() => {
    if (hydrated && !token) {
      router.push('/login');
    }
  }, [hydrated, token, router]);

  if (!hydrated) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-black mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-black">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Security Dashboard</h1>
            <p className="text-blue-50 text-lg">
              Monitor and analyze your projects for security vulnerabilities
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/projects/new" 
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black mb-1">Scan Single File</h3>
              <p className="text-black text-sm">Analyze a specific code file for vulnerabilities</p>
            </div>
          </div>
          <button 
            onClick={() => setScanModalOpen(true)}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start File Scan
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black mb-1">Scan Directory</h3>
              <p className="text-black text-sm">Analyze entire project directories or zip files</p>
            </div>
          </div>
          <button 
            onClick={() => setScanDirModalOpen(true)}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Start Directory Scan
          </button>
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">Your Projects</h2>
          <div className="text-sm text-black">
            {projects ? `${projects.length} project${projects.length !== 1 ? 's' : ''}` : '0 projects'}
          </div>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <Link 
                href={`/projects/${project._id}`} 
                key={project._id} 
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-blue-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <svg className="w-5 h-5 text-black group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-black truncate mb-3">
                    {project.repositoryUrl}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-black">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-16 w-16 text-black mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-black mb-2">No projects yet</h3>
            <p className="text-black mb-6">Get started by creating your first project to begin security analysis.</p>
            <Link 
              href="/projects/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Project
            </Link>
          </div>
        )}
      </div>

      <ScanFileModal open={scanModalOpen} onClose={() => setScanModalOpen(false)} />
      <ScanDirectoryModal open={scanDirModalOpen} onClose={() => setScanDirModalOpen(false)} />
    </div>
  );
}
