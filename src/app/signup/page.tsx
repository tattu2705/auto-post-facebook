'use client';

import AuthComponent from '../../components/auth/AuthComponent';

export default function SignUpPage() {
  return (
    <AuthComponent 
      initialMode="signup" 
      redirectTo="/" 
    />
  );
}