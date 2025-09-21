'use client';

import AuthComponent from '../../components/auth/AuthComponent';

export default function LoginPage() {
  return (
    <AuthComponent 
      initialMode="login" 
      redirectTo="/" 
    />
  );
}