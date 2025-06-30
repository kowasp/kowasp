import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewProjectPage from './page';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('../../../lib/api');
jest.mock('../../../stores/auth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;

describe('NewProjectPage', () => {
  let mockRouterPush: jest.Mock;
  let mockRouterReplace: jest.Mock;
  let mockRouterBack: jest.Mock;

  beforeEach(() => {
    mockRouterPush = jest.fn();
    mockRouterReplace = jest.fn();
    mockRouterBack = jest.fn();
    mockedUseRouter.mockReturnValue({
      push: mockRouterPush,
      replace: mockRouterReplace,
      back: mockRouterBack,
    });
    mockedApiClient.post.mockClear();
  });

  it('redirects to login if not authenticated', () => {
    mockedUseAuthStore.mockImplementation(selector => selector({ token: null }));
    render(<NewProjectPage />);
    expect(mockRouterReplace).toHaveBeenCalledWith('/login');
  });

  it('renders the form when authenticated', () => {
    mockedUseAuthStore.mockImplementation(selector => selector({ token: 'fake-token' }));
    render(<NewProjectPage />);
    expect(screen.getByRole('heading', { name: /Create New Project/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Repository URL/i)).toBeInTheDocument();
  });

  it('submits the form and redirects on successful creation', async () => {
    mockedUseAuthStore.mockImplementation(selector => selector({ token: 'fake-token' }));
    mockedApiClient.post.mockResolvedValue({ data: {} });
    
    render(<NewProjectPage />);

    fireEvent.change(screen.getByLabelText(/Project Name/i), { target: { value: 'My New Project' } });
    fireEvent.change(screen.getByLabelText(/Repository URL/i), { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith('/projects', {
        name: 'My New Project',
        repositoryUrl: 'https://github.com/test/repo',
      });
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays an error message if creation fails', async () => {
    mockedUseAuthStore.mockImplementation(selector => selector({ token: 'fake-token' }));
    mockedApiClient.post.mockRejectedValue(new Error('Creation failed'));
    
    render(<NewProjectPage />);

    fireEvent.change(screen.getByLabelText(/Project Name/i), { target: { value: 'Failed Project' } });
    fireEvent.change(screen.getByLabelText(/Repository URL/i), { target: { value: 'https://github.com/test/fail' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      expect(screen.getByText('Creation failed')).toBeInTheDocument();
    });
  });

  it('calls router.back when cancel button is clicked', () => {
    mockedUseAuthStore.mockImplementation(selector => selector({ token: 'fake-token' }));
    render(<NewProjectPage />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockRouterBack).toHaveBeenCalled();
  });
}); 