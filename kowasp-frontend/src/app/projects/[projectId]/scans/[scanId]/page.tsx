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
        <p className="text-black">The scan report you're looking for doesn't exist.</p>
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