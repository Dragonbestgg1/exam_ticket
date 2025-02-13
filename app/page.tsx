"use client"

import Header from '@/components/ui/Header';
import Monitor from '@/components/ui/Monitor';
import Listing from '@/components/function/Listing';
import AuditButtons from '@/components/function/AuditButtons';
import style from '@/styles/pages/page.module.css';
import { useSession } from 'next-auth/react';

const useUserAuthentication = () => {
  const session = useSession();
  const isAuthenticated = !!session?.data;
  return isAuthenticated;
};

export default function HomePage() {
  const isAuthenticated = useUserAuthentication();

  return (
    <div className={`${style.main}`}>
      <Header />
      <Monitor />
      {isAuthenticated ? <AuditButtons /> : <Listing />}
    </div>
  );
}