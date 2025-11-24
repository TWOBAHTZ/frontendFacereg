'use client'; 

import React, { useEffect } from 'react';
import styles from './login.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useMsal, useIsAuthenticated, MsalProvider } from "@azure/msal-react"; 
import { msalInstance } from '../authConfig'; 

const LoginPageContent = () => {
  const router = useRouter();
  const { instance } = useMsal(); 
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ["api://af39ad67-ec03-4cbd-88f3-762dd7a58dfe/access_as_user"],
        prompt: "select_account" 
      });
      
      console.log("Login successful:", loginResponse);
      router.push('/accesscontrol'); 

    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/accesscontrol');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className={styles.container}>
        <p>Authenticated. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.externalLogoWrapper}>
        <Image 
          src="/LogoApp.png" 
          alt="Face Recognition Smart Attendance System" 
          width={500}
          height={150}
          priority 
          style={{ width: '100%', height: 'auto' }}
          onError={(e) => e.currentTarget.style.display = 'none'} 
        />
      </div>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <Image 
              src="/Microsoft_logo.png" 
              alt="Microsoft Logo" 
              width={200}
              height={50}
              className={styles.headerLogo}
              priority 
              onError={(e) => e.currentTarget.style.display = 'none'} 
            />
          </div>
          <h2>Sign In</h2>
          <p>Use your Microsoft account to continue.</p>
        </div>

        <div className={styles.signInWrapper}>
          <button className={styles.microsoftButton} onClick={handleLogin}>
            <Image 
              src="/microsoft-logo.png" 
              alt="Microsoft Icon" 
              width={22} 
              height={22} 
              onError={(e) => e.currentTarget.style.display = 'none'} 
            />
            <span>Sign in with Microsoft</span>
          </button>
        </div>

        <div className={styles.footer}>
          <p>
            Having trouble?{' '}
            <Link href="/support" className={styles.link}>
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- (ส่วนหุ้ม MsalProvider) ---
const LoginPage = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <LoginPageContent />
    </MsalProvider>
  );
};

export default LoginPage;