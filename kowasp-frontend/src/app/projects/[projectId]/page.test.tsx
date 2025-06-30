import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectDetailsPage from './page';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

// Mock dependencies
jest.mock('@tanstack/react-query');
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

const mockedUseQuery = useQuery as jest.Mock;
const mockedUseMutation = useMutation as jest.Mock;
const mockedUseParams = useParams as jest.Mock;

describe('ProjectDetailsPage', () => {
  const mockProject = { name: 'Test Project', repositoryUrl: 'http://test.com' };
  const mockScans = [
    { _id: 'scan1', status: 'completed', createdAt: new Date().toISOString(), results: { summary: { totalIssues: 5 } } },
    { _id: 'scan2', status: 'running', createdAt: new Date().toISOString() },
  ];

  beforeEach(() => {
    mockedUseParams.mockReturnValue({ projectId: 'project1' });
    mockedUseMutation.mockReturnValue({ mutate: jest.fn() });
  });

  it('renders project details and scan history', async () => {
    mockedUseQuery
      .mockReturnValueOnce({ data: mockProject, isLoading: false }) // for project query
      .mockReturnValueOnce({ data: mockScans, isLoading: false }); // for scans query
      
    render(<ProjectDetailsPage />);
    
    expect(screen.getByRole('heading', { name: 'Test Project' })).toBeInTheDocument();
    expect(screen.getByText('http://test.com')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('shows an empty state when there are no scans', async () => {
    mockedUseQuery
      .mockReturnValueOnce({ data: mockProject, isLoading: false })
      .mockReturnValueOnce({ data: [], isLoading: false });
      
    render(<ProjectDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No scans yet. Start your first scan to see results.')).toBeInTheDocument();
    });
  });

  it('handles project not found', () => {
    mockedUseQuery.mockReturnValue({ data: null, isLoading: false });
    render(<ProjectDetailsPage />);
    expect(screen.getByText('Project not found')).toBeInTheDocument();
  });

  it('triggers a new scan when the button is clicked', async () => {
    const mutate = jest.fn();
    mockedUseQuery
      .mockReturnValueOnce({ data: mockProject, isLoading: false })
      .mockReturnValueOnce({ data: [], isLoading: false });
    mockedUseMutation.mockReturnValue({ mutate });

    render(<ProjectDetailsPage />);
    
    const newScanButton = screen.getByRole('button', { name: /New Scan/i });
    fireEvent.click(newScanButton);
    
    await waitFor(() => {
      expect(mutate).toHaveBeenCalled();
    });
  });
}); 