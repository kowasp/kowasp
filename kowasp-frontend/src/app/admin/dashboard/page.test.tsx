import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboardPage from './page';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock dependencies
jest.mock('@tanstack/react-query');

const mockedUseQuery = useQuery as jest.Mock;
const mockedUseMutation = useMutation as jest.Mock;

describe('AdminDashboardPage', () => {
  const mockUsers = [
    { _id: 'user1', email: 'user1@test.com', role: 'user', createdAt: new Date().toISOString() },
    { _id: 'user2', email: 'user2@test.com', role: 'admin', createdAt: new Date().toISOString() },
  ];
  const mockProjects = [{ _id: 'proj1', name: 'Admin Project', repositoryUrl: 'http://admin.com', createdAt: new Date().toISOString() }];
  const mockScans = [{ _id: 'scan1', status: 'completed', createdAt: new Date().toISOString() }];

  let mockMutate: jest.Mock;

  beforeEach(() => {
    mockMutate = jest.fn();
    mockedUseQuery.mockImplementation(({ queryKey }) => {
      const key = queryKey[0];
      if (key === 'admin-users') return { data: mockUsers, isLoading: false };
      if (key === 'admin-projects') return { data: mockProjects, isLoading: false };
      if (key === 'admin-scans') return { data: mockScans, isLoading: false };
      return { data: null, isLoading: false };
    });
    mockedUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });
  });

  it('renders stats and recent users/projects', () => {
    render(<AdminDashboardPage />);
    
    // Check stats
    expect(screen.getByText('Total Users').previousSibling).toHaveTextContent('2');
    expect(screen.getByText('Total Projects').previousSibling).toHaveTextContent('1');
    expect(screen.getByText('Total Scans').previousSibling).toHaveTextContent('1');
    expect(screen.getByText('Completed Scans').previousSibling).toHaveTextContent('1');

    // Check recent users and projects
    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('Admin Project')).toBeInTheDocument();
  });

  it('opens delete confirmation modal on delete button click', async () => {
    render(<AdminDashboardPage />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
  });

  it('calls delete mutation when deletion is confirmed', async () => {
    render(<AdminDashboardPage />);
    
    // Open the modal first
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      // Use getByRole to ensure the dialog is present
      const dialog = screen.getByRole('dialog');
      // Confirm deletion within the modal
      const confirmButton = within(dialog).getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('user1');
    });
  });

  it('closes the modal when cancel is clicked', async () => {
    render(<AdminDashboardPage />);
    
    // Open the modal
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    let dialog: HTMLElement | null = null;
    await waitFor(() => {
      dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    // Click cancel within the modal
    const cancelButton = within(dialog!).getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
}); 