'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/api';

interface User {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Project {
  _id: string;
  name: string;
  repositoryUrl: string;
  ownerId: string;
  createdAt: string;
}

interface Scan {
  _id: string;
  projectId: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.get('/admin/users').then(res => res.data),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => apiClient.get('/admin/projects').then(res => res.data),
  });

  const { data: scans, isLoading: scansLoading } = useQuery({
    queryKey: ['admin-scans'],
    queryFn: () => apiClient.get('/admin/scans').then(res => res.data),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowDeleteModal(false);
      setDeleteUserId(null);
    },
    onError: (error) => {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    },
  });

  const handleDeleteUser = (userId: string, userEmail: string) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate(deleteUserId);
    }
  };

  if (usersLoading || projectsLoading || scansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const totalUsers = users?.length || 0;
  const totalProjects = projects?.length || 0;
  const totalScans = scans?.length || 0;
  const completedScans = scans?.filter((scan: Scan) => scan.status === 'completed').length || 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-black mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-black">{totalUsers}</div>
          <div className="text-black">Total Users</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-black">{totalProjects}</div>
          <div className="text-black">Total Projects</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-black">{totalScans}</div>
          <div className="text-black">Total Scans</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-black">{completedScans}</div>
          <div className="text-black">Completed Scans</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-black mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.slice(0, 5).map((user: User) => (
                  <tr key={user._id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-black">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-black'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-black">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteUser(user._id, user.email)}
                        disabled={deleteUserMutation.isPending}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-black mb-4">Recent Projects</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Repository</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects?.slice(0, 5).map((project: Project) => (
                  <tr key={project._id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-black">{project.name}</td>
                    <td className="py-3 px-4 text-sm text-black truncate max-w-xs">
                      {project.repositoryUrl}
                    </td>
                    <td className="py-3 px-4 text-black">{new Date(project.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">Confirm Delete</h3>
            <p className="text-black mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteUserId(null);
                }}
                className="px-4 py-2 text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 