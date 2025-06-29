'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import React from 'react';
import Navbar from '../components/Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { hydrated } = useAuthStore();
  if (!hydrated) return null;
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl bg-white">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
} 