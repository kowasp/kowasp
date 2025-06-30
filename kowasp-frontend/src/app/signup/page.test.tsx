import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from './page';
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

describe('SignupPage', () => {
  let mockLogin: jest.Mock;
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    mockLogin = jest.fn();
    mockRouterPush = jest.fn();
    mockedUseRouter.mockReturnValue({ push: mockRouterPush, replace: jest.fn() });
    mockedApiClient.post.mockClear();
    
    const state = {
      token: null,
      user: null,
      login: mockLogin,
    };
    mockedUseAuthStore.mockImplementation((selector?: (s: typeof state) => any) => {
      if (selector) return selector(state);
      return state;
    });
  });

  it('should render the signup form', () => {
    render(<SignupPage />);
    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  it('should create a new user and redirect to /dashboard', async () => {
    const user = { email: 'new@example.com', role: 'user' };
    mockedApiClient.post.mockResolvedValue({
      data: { access_token: 'fake-token', user },
    });
    
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/signup', {
        email: 'new@example.com',
        password: 'password123',
      });
      expect(mockLogin).toHaveBeenCalledWith('fake-token', user);
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show an error if passwords do not match', async () => {
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('should show an error if the user already exists', async () => {
    mockedApiClient.post.mockRejectedValue({
      response: { data: { message: 'User already exists' } },
    });

    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'exists@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });
  });
}); 