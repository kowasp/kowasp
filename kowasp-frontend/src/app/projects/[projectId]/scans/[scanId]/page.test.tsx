import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScanReportPage from './page';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

// Mock dependencies
jest.mock('@tanstack/react-query');
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

const mockedUseQuery = useQuery as jest.Mock;
const mockedUseParams = useParams as jest.Mock;

describe('ScanReportPage', () => {
  beforeEach(() => {
    mockedUseParams.mockReturnValue({ scanId: 'scan1' });
  });

  it('displays loading state initially', () => {
    mockedUseQuery.mockReturnValue({ data: null, isLoading: true });
    render(<ScanReportPage />);
    expect(screen.getByText('Loading scan report...')).toBeInTheDocument();
  });

  it('displays "scan not found" message', () => {
    mockedUseQuery.mockReturnValue({ data: null, isLoading: false });
    render(<ScanReportPage />);
    expect(screen.getByText('Scan not found')).toBeInTheDocument();
  });

  it('displays "scan in progress" message', () => {
    mockedUseQuery.mockReturnValue({ data: { status: 'running' }, isLoading: false });
    render(<ScanReportPage />);
    expect(screen.getByText('Scan in progress')).toBeInTheDocument();
  });

  it('displays "scan failed" message', () => {
    mockedUseQuery.mockReturnValue({ data: { status: 'failed' }, isLoading: false });
    render(<ScanReportPage />);
    expect(screen.getByText('Scan failed')).toBeInTheDocument();
  });

  it('displays "no vulnerabilities found" message for completed scan with no findings', () => {
    mockedUseQuery.mockReturnValue({ data: { status: 'completed', results: { findings: [] } }, isLoading: false });
    render(<ScanReportPage />);
    expect(screen.getByText('No vulnerabilities found!')).toBeInTheDocument();
  });

  it('renders the scan report with findings', async () => {
    const mockScan = {
      status: 'completed',
      results: {
        findings: [
          {
            static: {
              rule: 'XSS',
              severity: 'high',
              description: 'A serious vulnerability.',
              location: { file: 'app.js', line: 10, column: 5 },
              code: '<div>Hello</div>',
              remediation: 'Sanitize input.',
            },
          },
        ],
      },
    };
    mockedUseQuery.mockReturnValue({ data: mockScan, isLoading: false });
    render(<ScanReportPage />);

    await waitFor(() => {
      expect(screen.getByText('Scan Report')).toBeInTheDocument();
      expect(screen.getByText('XSS')).toBeInTheDocument();
      expect(screen.getByText('A serious vulnerability.')).toBeInTheDocument();
      expect(screen.getByText('File:')).toBeInTheDocument();
    });
  });
}); 