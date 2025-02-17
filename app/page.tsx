"use client"

import Header from '@/components/ui/Header';
import Monitor from '@/components/ui/Monitor';
import Listing from '@/components/function/Listing';
import AuditButtons from '@/components/function/AuditButtons';
import style from '@/styles/pages/page.module.css';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { StructuredData } from '@/app/types';

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
    const timerInterval = useRef<NodeJS.Timeout | null>(null);
    const [mongoData, setMongoData] = useState<StructuredData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [errorLoadingData, setErrorLoadingData] = useState<Error | null>(null);
    const [timeoutError, setTimeoutError] = useState<boolean>(false);
    const [examOptions, setExamOptions] = useState<string[]>([]);
    const [classOptions, setClassOptions] = useState<string[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');

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

            }, 1000);
        } else {
            clearInterval(timerInterval.current as NodeJS.Timeout);
            timerInterval.current = null;
        }

        return () => clearInterval(timerInterval.current as NodeJS.Timeout);
    }, [isRunning, timerStartTime, calculatedStartTimeMs, calculatedEndTimeMs]);

    const handleStart = () => {
        if (isRunning) {
            clearInterval(timerInterval.current as NodeJS.Timeout);
        }
        setIsRunning(true);
        setTimerStartTime(Date.now());
        setElapsedTime(0);
        setExtraTime(0);
    };

    const handleEnd = () => {
        setIsRunning(false);
        clearInterval(timerInterval.current as NodeJS.Timeout);
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

    const handleExamChange = (exam: string) => {
        setSelectedExam(exam);
    };

    const handleClassChange = (className: string) => {
        setSelectedClass(className);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            setErrorLoadingData(null);
            setTimeoutError(false);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                setTimeoutError(true);
            }, 5000);

            try {
                const examsResponse = await fetch('/api/exam', { signal: controller.signal });
                if (!examsResponse.ok) {
                    throw new Error(`HTTP error! status: ${examsResponse.status} - Exams`);
                }
                const examsData = await examsResponse.json();
                setExamOptions(examsData.examNames || []);

                const classesResponse = await fetch('/api/classes', { signal: controller.signal });
                if (!classesResponse.ok) {
                    throw new Error(`HTTP error! status: ${classesResponse.status} - Classes`);
                }
                const classesData = await classesResponse.json();
                setClassOptions(classesData.classNames || []);

                const mongoResponse = await fetch('/api/mongo-data', { signal: controller.signal });
                if (!mongoResponse.ok) {
                    throw new Error(`HTTP error! status: ${mongoResponse.status} - Mongo Data`);
                }
                const data: StructuredData = await mongoResponse.json();
                setMongoData(data);

            } catch (error: unknown) {
                if (error instanceof Error) {
                    setErrorLoadingData(new Error('Request timed out'));
                } else {
                    setErrorLoadingData(error instanceof Error ? error : new Error('An unknown error occurred'));
                }
            } finally {
                clearTimeout(timeoutId);
                setLoadingData(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchFilteredData = async () => {
            setLoadingData(true);
            setErrorLoadingData(null);
            setTimeoutError(false);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                setTimeoutError(true);
            }, 5000);

            try {
                const queryString = new URLSearchParams({
                    exam: selectedExam,
                    class: selectedClass,
                }).toString();

                const response = await fetch(`/api/filtered-mongo-data?${queryString}`, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - Filtered Mongo Data`);
                }
                const data: StructuredData = await response.json();
                setMongoData(data);

            } catch (error: unknown) {
                if (error instanceof Error) {
                    setErrorLoadingData(new Error('Request timed out'));
                } else {
                    setErrorLoadingData(error instanceof Error ? error : new Error('An unknown error occurred'));
                }
            } finally {
                clearTimeout(timeoutId);
                setLoadingData(false);
            }
        };

        fetchFilteredData();

    }, [selectedExam, selectedClass]);

    return (
        <div className={`${style.main}`}>
            <Header onFilterChange={handleFilterChange} isFilterActive={isHomePage} />
            <Monitor
                startTime={formatTimeHM(startTimeString)}
                endTime={formatTimeHM(endTimeString)}
                elapsedTime={formatTime(elapsedTime)}
                extraTime={formatTime(extraTime)}
            />
            {loadingData && <div>Loading data...</div>}
            {timeoutError && <div style={{ color: 'red' }}>Data loading timed out. Please check your connection or try again later.</div>}
            {!timeoutError && errorLoadingData && <div>Error loading data: {errorLoadingData.message}</div>}

            {!loadingData && !errorLoadingData && !timeoutError && (
                isAuthenticated ? (
                    <>
                        <div className={`${style.content}`}>
                            <Listing
                                filterText={filterText}
                                initialRecordsData={mongoData}
                                examOptions={examOptions}
                                classOptions={classOptions}
                                selectedExam={selectedExam}
                                selectedClass={selectedClass}
                                onExamChange={handleExamChange}
                                onClassChange={handleClassChange}
                            />
                            <AuditButtons onStart={handleStart} onEnd={handleEnd} />
                        </div>
                    </>
                ) : (
                    <>
                        <Listing
                            filterText={filterText}
                            initialRecordsData={mongoData}
                            examOptions={examOptions}
                            classOptions={classOptions}
                            selectedExam={selectedExam}
                            selectedClass={selectedClass}
                            onExamChange={handleExamChange}
                            onClassChange={handleClassChange}
                        />
                    </>
                )
            )}
        </div>
    );
}