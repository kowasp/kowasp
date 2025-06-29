'use client';

import { useAuthStore } from '../stores/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace('/dashboard');
    }
  }, [token, router]);

  if (token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-bold text-black mb-4">Welcome to KOWASP</h1>
        <p className="text-xl text-black mb-8">Your friendly neighborhood OWASP scanner.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/signup" 
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-3 border border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
