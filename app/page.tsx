"use client"

import Header from '@/components/ui/Header';
import Monitor from '@/components/ui/Monitor';
import Listing from '@/components/function/Listing';
import AuditButtons from '@/components/function/AuditButtons';
import style from '@/styles/pages/page.module.css';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const useUserAuthentication = () => {
  const session = useSession();
  const isAuthenticated = !!session?.data;
  return isAuthenticated;
};

export default function HomePage() {
  const isAuthenticated = useUserAuthentication();
  const [filterText, setFilterText] = useState<string>('');
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const startTimeString = "12:39";
  const endTimeString = "12:40";
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerStartTime, setTimerStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [extraTime, setExtraTime] = useState<number>(0);
  const timerInterval = useRef<number | null>(null);

  const parseTimeToMs = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 3600 + minutes * 60) * 1000;
  };

  const calculatedStartTimeMs = parseTimeToMs(startTimeString);
  const calculatedEndTimeMs = parseTimeToMs(endTimeString);


  useEffect(() => {
    if (isRunning) {
      timerInterval.current = setInterval(() => {
        const currentElapsedTime = Date.now() - timerStartTime;
        setElapsedTime(currentElapsedTime);

        const totalTimeMs = calculatedStartTimeMs + currentElapsedTime;
        if (totalTimeMs > calculatedEndTimeMs) {
          setExtraTime(totalTimeMs - calculatedEndTimeMs);
        } else {
          setExtraTime(0);
        }

      }, 1000) as any;
    } else {
      clearInterval(timerInterval.current as any);
      timerInterval.current = null;
    }

    return () => clearInterval(timerInterval.current as any);
  }, [isRunning, timerStartTime, calculatedStartTimeMs, calculatedEndTimeMs]);

  const handleStart = () => {
    if (isRunning) {
      clearInterval(timerInterval.current as any);
    }
    setIsRunning(true);
    setTimerStartTime(Date.now());
    setElapsedTime(0);
    setExtraTime(0);
  };

  const handleEnd = () => {
    setIsRunning(false);
    clearInterval(timerInterval.current as any);
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatTimeHM = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const handleFilterChange = (text: string) => {
    setFilterText(text);
  };

  return (
    <div className={`${style.main}`}>
      <Header onFilterChange={handleFilterChange} isFilterActive={isHomePage} />
      <Monitor
        startTime={formatTimeHM(startTimeString)}
        endTime={formatTimeHM(endTimeString)}
        elapsedTime={formatTime(elapsedTime)}
        extraTime={formatTime(extraTime)}
      />
      {isAuthenticated ? (
        <>
          <div className={`${style.content}`}>
            <Listing filterText={filterText} />
            <AuditButtons onStart={handleStart} onEnd={handleEnd} />
          </div>
        </>
      ) : (
        <Listing filterText={filterText} />
      )}
    </div>
  );
}