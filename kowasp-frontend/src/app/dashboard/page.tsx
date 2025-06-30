"use client";

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'next/navigation';
import { ScanFileModal } from '../../components/dashboard/ScanFileModal';
import { ScanDirectoryModal } from '../../components/dashboard/ScanDirectoryModal';

interface Project {
  _id: string;
  name: string;
  repositoryUrl: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [isScanFileModalOpen, setScanFileModalOpen] = useState(false);
  const [isScanDirModalOpen, setScanDirModalOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  const { data: projects, isLoading, error } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects');
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <div className="flex gap-4">
          <button onClick={() => setScanFileModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Scan File</button>
          <button onClick={() => setScanDirModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Scan Directory</button>
          <Link href="/projects/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">New Project</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Link key={project._id} href={`/projects/${project._id}`} className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
            <p className="text-gray-600 truncate">{project.repositoryUrl}</p>
            <p className="text-sm text-gray-400 mt-4">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>

      <ScanFileModal open={isScanFileModalOpen} onClose={() => setScanFileModalOpen(false)} />
      <ScanDirectoryModal open={isScanDirModalOpen} onClose={() => setScanDirModalOpen(false)} />
    </div>
  );
}
