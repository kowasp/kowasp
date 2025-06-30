'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../../../lib/api';
import { useParams } from 'next/navigation';

interface Finding {
  static: {
    rule: string;
    severity: string;
    description: string;
    location: {
      file: string;
      line: number;
      column: number;
    };
    code: string;
    remediation: string;
  };
  llm?: {
    isVulnerable: boolean;
    confidence: number;
    explanation: string;
    remediation: string;
    codeExample: string;
  };
}

export default function ScanReportPage() {
  const params = useParams();
  const scanId = params.scanId as string;

  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => apiClient.get(`/scans/${scanId}`).then(res => res.data),
    enabled: !!scanId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading scan report...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-black mb-2">Scan not found</h2>
        <p className="text-black">The scan report you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  // Show spinner and message if scan is running
  if (scan.status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-6"></div>
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Scan in progress</h2>
        <p className="text-black">Your repository is being analyzed. This may take a minute or two.<br/>Please wait...</p>
      </div>
    );
  }

  // Show error if scan failed
  if (scan.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <svg className="h-12 w-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        </svg>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Scan failed</h2>
        <p className="text-black">There was an error running the scan. Please try again or check your repository URL.</p>
      </div>
    );
  }

  // Show message if scan completed and no findings
  if (scan.status === 'completed' && (!scan.results?.findings || scan.results.findings.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <svg className="h-16 w-16 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-green-700 mb-2">No vulnerabilities found!</h2>
        <p className="text-black">Your code is looking good. No XSS vulnerabilities were detected in this scan. 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Scan Report</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          scan.status === 'completed' ? 'bg-green-100 text-green-800' :
          scan.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
          scan.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {scan.status}
        </span>
      </div>

      <div className="space-y-4">
        {scan.results?.findings?.map((finding: Finding, index: number) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                finding.static.severity === 'high' ? 'bg-red-100 text-red-800' : 
                finding.static.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {finding.static.severity}
              </span>
              <h3 className="text-lg font-semibold text-black">{finding.static.rule}</h3>
            </div>
            <div className="space-y-3 text-black">
              <p><strong>Description:</strong> {finding.static.description}</p>
              <p><strong>File:</strong> {finding.static.location.file}:{finding.static.location.line}</p>
              <p><strong>Remediation:</strong> {finding.static.remediation}</p>
              {finding.static.code && (
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm"><code>{finding.static.code}</code></pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 