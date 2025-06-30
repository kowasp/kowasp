'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import apiClient from '../../../lib/api';
import Link from 'next/link';

interface Scan {
  _id: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  results?: {
    summary?: {
      totalIssues: number;
    };
  };
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [isCreatingScan, setIsCreatingScan] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiClient.get(`/projects/${projectId}`).then(res => res.data),
    enabled: !!projectId,
  });

  const { data: scans, isLoading: scansLoading } = useQuery({
    queryKey: ['scans', projectId],
    queryFn: () => apiClient.get(`/scans/project/${projectId}`).then(res => res.data),
    enabled: !!projectId,
  });

  const createScanMutation = useMutation({
    mutationFn: () => apiClient.post(`/scans/project/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', projectId] });
      setIsCreatingScan(false);
    },
    onError: (error) => {
      console.error('Failed to create scan:', error);
      setIsCreatingScan(false);
    },
  });

  const handleNewScan = async () => {
    setIsCreatingScan(true);
    createScanMutation.mutate();
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading project...</p>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-black mb-2">Project not found</h2>
        <p className="text-black">The project you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black">{project.name}</h1>
          <p className="text-black mt-1">{project.repositoryUrl}</p>
        </div>
        <button 
          onClick={handleNewScan}
          disabled={isCreatingScan}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isCreatingScan ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Scan...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Scan
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-black mb-6">Scan History</h2>
        {scansLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
            <span className="text-black">Loading scans...</span>
          </div>
        ) : scans && scans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Issues Found</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan: Scan) => (
                  <tr key={scan._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black">{new Date(scan.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        scan.status === 'completed' ? 'bg-green-100 text-green-800' :
                        scan.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                        scan.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-black">
                      {scan.results?.summary?.totalIssues || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/projects/${projectId}/scans/${scan._id}`} 
                        className="px-3 py-1 border border-gray-300 text-black rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-black mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-black">No scans yet. Start your first scan to see results.</p>
          </div>
        )}
      </div>
    </div>
  );
} 