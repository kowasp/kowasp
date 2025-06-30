'use client';

import { useAuthStore } from '../stores/auth';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { token, logout, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  if (!token) return null;

  // Determine dashboard link based on user role
  const dashboardLink = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
  const dashboardText = user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard';

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md shadow-lg rounded-b-2xl px-4 py-2 flex items-center justify-between mb-8 border-b border-gray-100">
      <div className="flex items-center gap-6">
        <Link href={dashboardLink} className="text-2xl font-extrabold tracking-tight text-black hover:text-gray-800 transition-colors">
          KOWASP
        </Link>
        <div className="hidden lg:flex gap-4 ml-8">
          <Link href={dashboardLink} className="px-3 py-2 rounded-lg text-black hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors">{dashboardText}</Link>
          <Link href="/projects/new" className="px-3 py-2 rounded-lg text-black hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors">New Project</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 bg-white/80 px-4 py-2 rounded-xl shadow border border-gray-200">
          <span className="text-black font-medium">{user?.email}</span>
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="px-3 py-1 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 font-medium transition-colors border border-red-200"
          >
            Logout
          </button>
        </div>
        {/* Hamburger for mobile */}
        <div className="lg:hidden">
          <button className="p-2 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>
      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-lg rounded-b-2xl z-50 border-b border-gray-100 lg:hidden animate-fade-in">
          <ul className="flex flex-col gap-2 p-4">
            <li><Link href={dashboardLink} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-black hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors">{dashboardText}</Link></li>
            <li><Link href="/projects/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-black hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors">New Project</Link></li>
            <li className="flex items-center gap-2 mt-2 bg-white/80 px-3 py-2 rounded-xl shadow border border-gray-200">
              <span className="text-black font-medium">{user?.email}</span>
              <button 
                onClick={() => { setMenuOpen(false); logout(); router.push('/'); }}
                className="px-3 py-1 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 font-medium transition-colors border border-red-200"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
} 
