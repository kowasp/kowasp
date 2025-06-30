import React, { useState } from 'react';
import apiClient from '../../lib/api';
import { ModernModal } from './ModernModal';

// Interfaces can be shared or defined per-component
interface ScanResult {
  summary?: {
    totalIssues: number;
    severityBreakdown?: Record<string, number>;
    filesAnalyzed?: number;
  };
  findings?: Array<any>;
  recommendations?: string[];
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

export function ScanDirectoryModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleScan = async () => {
    if (!files) return;
    setLoading(true);
    setError('');
    setResult(null);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await apiClient.post('/scans/directory', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError?.response?.data?.message || apiError.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernModal open={open} onClose={onClose} title="Scan Directory">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-black">Upload Directory</label>
          <input
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {/* Scan Button and Results - similar structure to ScanFileModal */}
        
      </div>
    </ModernModal>
  );
} 