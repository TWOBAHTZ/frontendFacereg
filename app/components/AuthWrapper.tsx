'use client';

import React, { useEffect } from 'react';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useRouter } from 'next/navigation';
import { msalInstance } from "../authConfig"; 

const RedirectToLogin = () => {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f0f2f5' 
    }}>
      Redirecting to login...
    </div>
  );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedTemplate>
        {children}
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <RedirectToLogin />
      </UnauthenticatedTemplate>
    </MsalProvider>
  );
};