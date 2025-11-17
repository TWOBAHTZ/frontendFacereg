'use client';

import React, { useEffect } from 'react';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useRouter } from 'next/navigation';

// ✨ [แก้ไข] 1. Import msalInstance ที่แชร์กัน
import { msalInstance } from "../authConfig"; 

// ❌ [ลบ] 2. ลบการสร้าง instance ใหม่ออก
// import { PublicClientApplication } from "@azure/msal-browser";
// import { msalConfig } from "../authConfig"; 
// const msalInstance = new PublicClientApplication(msalConfig);

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
    // ✨ [แก้ไข] 3. ใช้ msalInstance ที่ import เข้ามา
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