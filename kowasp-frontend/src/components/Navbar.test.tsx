import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from './Navbar';
import { useAuthStore } from '../stores/auth';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() })
}));

// Mock the auth store and cast it to a Jest mock for type safety
jest.mock('../stores/auth');
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('Navbar', () => {
  it('renders the Navbar component when a user is logged in', () => {
    // Provide the mock implementation for the auth store for this test
    mockedUseAuthStore.mockReturnValue({
      token: 'fake-token',
      user: { email: 'test@example.com', role: 'user' },
    });

    render(<Navbar />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders nothing when no user is logged in', () => {
    // Provide the mock implementation for the auth store for this test
    mockedUseAuthStore.mockReturnValue({
      token: null,
      user: null,
    });

    const { container } = render(<Navbar />);

    // The component should return null, so the container should be empty
    expect(container.firstChild).toBeNull();
  });
}); 