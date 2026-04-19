import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';
import * as firebaseService from '../../services/firebase';

// Mock the firebase service
vi.mock('../../services/firebase', () => ({
  auth: {},
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  bootstrapAuthSession: vi.fn(),
  isMobileUserAgent: vi.fn(() => false),
}));

// Test component to consume the hook
const TestConsumer = () => {
  const { user, initializing, logout } = useAuth();
  return (
    <div>
      <div data-testid="initializing">{initializing.toString()}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initially has initializing state as true', async () => {
    firebaseService.bootstrapAuthSession.mockReturnValue(new Promise(() => {})); // Never resolves
    firebaseService.onAuthStateChanged.mockReturnValue(() => {});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('initializing')).toHaveTextContent('true');
  });

  it('sets initializing to false and user to mockUser after bootstrap', async () => {
    const mockUser = { email: 'test@example.com', uid: '123' };
    firebaseService.bootstrapAuthSession.mockResolvedValue(mockUser);
    firebaseService.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initializing')).toHaveTextContent('false');
    }, { timeout: 2000 });
    
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  it('handles logout correctly', async () => {
    const mockUser = { email: 'test@example.com', uid: '123' };
    firebaseService.bootstrapAuthSession.mockResolvedValue(mockUser);
    firebaseService.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    // Trigger logout
    screen.getByTestId('logout-btn').click();

    await waitFor(() => {
      expect(firebaseService.signOut).toHaveBeenCalled();
    });
  });
});
