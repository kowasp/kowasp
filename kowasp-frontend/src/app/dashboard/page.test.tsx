import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from './page';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@tanstack/react-query');
jest.mock('../../stores/auth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockedUseQuery = useQuery as jest.Mock;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;

describe('DashboardPage', () => {
  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ replace: jest.fn() });
    mockedUseAuthStore.mockReturnValue({ token: 'fake-token', user: { email: 'test@test.com' } });
  });

  it('shows a loading state initially', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<DashboardPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows an error message if fetching projects fails', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });
    render(<DashboardPage />);
    expect(screen.getByText('An error occurred: Failed to fetch')).toBeInTheDocument();
  });

  it('displays a list of projects when fetched successfully', async () => {
    const projects = [
      { _id: '1', name: 'Project Alpha', repositoryUrl: 'http://a.com', createdAt: new Date().toISOString() },
      { _id: '2', name: 'Project Beta', repositoryUrl: 'http://b.com', createdAt: new Date().toISOString() },
    ];
    mockedUseQuery.mockReturnValue({
      data: projects,
      isLoading: false,
      error: null,
    });
    render(<DashboardPage />);
    
    await waitFor(() => {
      const projectLinks = screen.getAllByRole('link').filter(link => /^\/projects\//.test(link.getAttribute('href') || ''));
      // Expect 3 links: 2 for the projects, 1 for the "New Project" button
      expect(projectLinks.length).toBe(3);
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });
  });

  it('displays an empty state when there are no projects', async () => {
    mockedUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<DashboardPage />);
    
    await waitFor(() => {
      const projectLinks = screen.getAllByRole('link').filter(link => /^\/projects\//.test(link.getAttribute('href') || ''));
      // The "New Project" button is always there
      expect(projectLinks.length).toBe(1);
    });
    // Check that the main heading is still there
    expect(screen.getByRole('heading', { name: 'Your Projects' })).toBeInTheDocument();
  });
}); 