import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './page';
import apiClient from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('../../lib/api');
jest.mock('../../stores/auth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;

describe('LoginPage', () => {
  let mockLogin: jest.Mock;
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockLogin = jest.fn();
    mockRouterPush = jest.fn();
    
    mockedUseRouter.mockReturnValue({ push: mockRouterPush, replace: jest.fn() });

    const state = {
      token: null,
      user: null,
      login: mockLogin,
    };

    // This implementation handles both `useAuthStore()` and `useAuthStore(selector)`
    mockedUseAuthStore.mockImplementation((selector?: (s: typeof state) => any) => {
      if (selector) {
        return selector(state);
      }
      return state;
    });
  });

  it('should render the login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /Sign in to KOWASP/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should log in a regular user and redirect to /dashboard', async () => {
    const user = { email: 'user@example.com', role: 'user' };
    mockedApiClient.post.mockResolvedValue({
      data: { access_token: 'fake-token', user },
    });
    
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('fake-token', user);
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should log in an admin user and redirect to /admin/dashboard', async () => {
    const adminUser = { email: 'admin@example.com', role: 'admin' };
    mockedApiClient.post.mockResolvedValue({
      data: { access_token: 'fake-token', user: adminUser },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('fake-token', adminUser);
      expect(mockRouterPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('should display an error message on failed login', async () => {
    mockedApiClient.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});