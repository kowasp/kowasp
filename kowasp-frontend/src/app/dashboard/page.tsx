"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
const MonacoEditor = dynamic<any>(() => import('@monaco-editor/react').then(mod => mod.default), { ssr: false });

export default function Dashboard() {
  const [code, setCode] = useState('');
  const [findings, setFindings] = useState<any[]>([]);
  const [llmResponse, setLlmResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFindings([]);
    setLlmResponse('');
    try {
      const res = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();
      setFindings(data.vulnerabilities || data.findings || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleLlmReview = async () => {
    setLlmLoading(true);
    setError('');
    setLlmResponse('');
    try {
      const res = await fetch('http://localhost:3001/llm-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings })
      });
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();
      setLlmResponse(data.response || JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <form onSubmit={handleAnalyze} className="flex flex-col gap-4 w-full max-w-xl">
        <MonacoEditor
          height="200px"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value: string | undefined) => setCode(value || '')}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
          disabled={loading || !code.trim()}
        >
          {loading ? 'Analyzing...' : 'Analyze (Static Scan)'}
        </button>
      </form>
      {loading && (
        <div className="flex items-center gap-2 mt-4 text-blue-700">
          <svg className="animate-spin h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Analyzing code, please wait...</span>
        </div>
      )}
      {error && <div className="text-red-600">Error: {error}</div>}
      {findings.length > 0 && !loading && (
        <div className="mt-4 p-4 border rounded bg-gray-100 w-full max-w-xl">
          <strong>Static Analysis Findings:</strong>
          <ul className="list-disc ml-6">
            {findings.map((f, i) => (
              <li key={i} className="mb-2">
                <div><b>Type:</b> {f.type}</div>
                <div><b>Severity:</b> {f.severity}</div>
                <div><b>Location:</b> {f.location?.line && f.location.line > 0
                  ? `${f.location.file}:${f.location.line}`
                  : `${f.location.file} (global/misconfiguration)`}
                </div>
                <div><b>Description:</b> {f.description}</div>
                {f.code && <pre className="bg-white p-2 rounded text-xs overflow-x-auto">{f.code}</pre>}
                {f.remediation && <div><b>Remediation:</b> {f.remediation}</div>}
              </li>
            ))}
          </ul>
          <button
            onClick={handleLlmReview}
            className="mt-4 bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50"
            disabled={llmLoading}
          >
            {llmLoading ? 'Reviewing with LLM...' : 'Review with LLM'}
          </button>
          {llmLoading && (
            <div className="flex items-center gap-2 mt-4 text-green-700">
              <svg className="animate-spin h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Reviewing with LLM, please wait...</span>
            </div>
          )}
        </div>
      )}
      {!loading && findings.length === 0 && !error && (
        <div className="text-gray-500 mt-4">No findings to display yet. Paste your code and click Analyze.</div>
      )}
      {llmResponse && !llmLoading && (
        <div className="mt-4 p-4 border rounded bg-yellow-100 w-full max-w-xl whitespace-pre-wrap">
          <strong>LLM Review:</strong>
          <div>{llmResponse}</div>
        </div>
      )}
    </div>
  );
}
