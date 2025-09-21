'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

interface AuthComponentProps {
  initialMode?: 'login' | 'signup';
  redirectTo?: string;
}

export default function AuthComponent({ 
  initialMode = 'login', 
  redirectTo = '/' 
}: AuthComponentProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const router = useRouter();

  const handleSwitchToSignUp = () => {
    setMode('signup');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  const handleAuthSuccess = () => {
    // Redirect to the specified page after successful authentication
    router.push(redirectTo);
  };

  if (mode === 'signup') {
    return (
      <SignUpForm
        onSwitchToLogin={handleSwitchToLogin}
        onSignUpSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <LoginForm
      onSwitchToSignUp={handleSwitchToSignUp}
      onLoginSuccess={handleAuthSuccess}
    />
  );
}