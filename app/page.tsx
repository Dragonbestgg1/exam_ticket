"use client"

import Header from '@/components/ui/Header';
import Monitor from '@/components/ui/Monitor';
import Listing from '@/components/function/Listing';
import AuditButtons from '@/components/function/AuditButtons';
import style from '@/styles/pages/page.module.css';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { StructuredData, StudentRecord } from '@/types/types';

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

    const startTimeString = "00:00";
    const endTimeString = "00:00";
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
    const [firstStudent, setFirstStudent] = useState<StudentRecord | null>(null);
    const [currentStudentIndex, setCurrentStudentIndex] = useState<number>(0);
    const [currentStudentList, setCurrentStudentList] = useState<StudentRecord[]>([]);
    const [headerCurrentTime, setHeaderCurrentTime] = useState<string>('');

    const parseTimeToMinutes = (timeString: string): number => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const parseTimeToMilliseconds = (timeString: string): number => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return (hours * 3600 + minutes * 60) * 1000;
    };

    const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const formatTimeHoursMinutes = (timeString: string | null | undefined): string => {
        if (!timeString) return "00:00";
        const parts = timeString.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
        return "00:00";
    };

    const calculatedStartTimeMs = parseTimeToMilliseconds(startTimeString);
    const calculatedEndTimeMs = parseTimeToMilliseconds(endTimeString);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setHeaderCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };

        updateTime();

        const timeUpdateIntervalId = setInterval(updateTime, 1000);

        return () => clearInterval(timeUpdateIntervalId);
    }, []);

    useEffect(() => {
        if (isRunning) {
            timerInterval.current = setInterval(() => {
                const currentElapsedTime = Date.now() - timerStartTime;
                setElapsedTime(currentElapsedTime);

                const currentStudentEndTime = firstStudent?.examEndTime;
                const currentStudentStartTime = firstStudent?.examStartTime;

                if (currentStudentEndTime && currentStudentStartTime) {
                    const calculatedEndTimeMsForStudent = parseTimeToMilliseconds(currentStudentEndTime);
                    const calculatedStartTimeMsForStudent = parseTimeToMilliseconds(currentStudentStartTime);
                    const totalTimeMs = calculatedStartTimeMsForStudent + currentElapsedTime;

                    if (totalTimeMs > calculatedEndTimeMsForStudent) {
                        setExtraTime(totalTimeMs - calculatedEndTimeMsForStudent);
                    } else {
                        setExtraTime(0);
                    }
                }
            }, 1000);
        } else {
            clearInterval(timerInterval.current as NodeJS.Timeout);
            timerInterval.current = null;
        }

        return () => clearInterval(timerInterval.current as NodeJS.Timeout);
    }, [isRunning, timerStartTime, firstStudent?.examEndTime, firstStudent?.examStartTime]);

    const handleStart = async (startTime: string) => {
        setIsRunning(true);
        setTimerStartTime(Date.now());
        setElapsedTime(0);
        setExtraTime(0);
    
        if (!firstStudent) return;
    
        const updatedStudent = { ...firstStudent, auditStartTime: startTime };
        setFirstStudent(updatedStudent);
    
        try {
            const response = await fetch('/api/student/updateAuditTime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: firstStudent._id,
                    auditStartTime: startTime,
                    examName: selectedExam,  
                    className: selectedClass, 
                }),
            });
    
            if (!response.ok) {
                console.error('Failed to update audit start time in DB');
            }
    
            await updateSubsequentStudentTimes(updatedStudent, true, selectedExam, selectedClass);
    
        } catch (error) {
            console.error('Error updating audit start time:', error);
        }
    };
    
    const handleEnd = async (endTime: string) => {
        setIsRunning(false);
        clearInterval(timerInterval.current as NodeJS.Timeout);
    
        if (!firstStudent) return;
    
        const updatedStudent = { ...firstStudent, auditEndTime: endTime };
        setFirstStudent(updatedStudent);
    
        const formattedElapsedTime = formatTime(elapsedTime);
        const formattedExtraTime = formatTime(extraTime);
    
        try {
            const response = await fetch('/api/student/updateAuditTime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: firstStudent._id,
                    auditEndTime: endTime,
                    examName: selectedExam,
                    className: selectedClass,
                    auditElapsedTime: formattedElapsedTime,
                    auditExtraTime: formattedExtraTime,
                }),
            });
    
            if (!response.ok) {
                console.error('Failed to update audit end time in DB');
            }
    
            await updateSubsequentStudentTimes(updatedStudent, false, selectedExam, selectedClass);
    
        } catch (error) {
            console.error('Error updating audit end time:', error);
        }
    };

    const updateSubsequentStudentTimes = async (currentStudent: StudentRecord, isStart: boolean, examName: string, className: string) => {
        if (!mongoData || !currentStudentList) return;
    
        const currentIndex = currentStudentIndex;
        const currentAuditEndTime = currentStudent.auditEndTime || currentStudent.examEndTime;
        let currentExamEndTimeParsed = 0;
        if (currentAuditEndTime) {
            currentExamEndTimeParsed = parseTimeToMinutes(currentAuditEndTime);
        } else {
            currentExamEndTimeParsed = parseTimeToMinutes(currentStudent.examEndTime);
        }
        const currentExamStartTimeParsed = parseTimeToMinutes(currentStudent.examStartTime);
    
        let lastEndTimeMinutes = currentExamEndTimeParsed;
        const updatedStudentList = [...currentStudentList];
    
        for (let i = currentIndex + 1; i < updatedStudentList.length; i++) {
            const studentToUpdate = updatedStudentList[i];
            if (!studentToUpdate) continue;
    
            const originalStartTimeMinutes = parseTimeToMinutes(studentToUpdate.examStartTime);
    
            const studentDurationMinutes = parseInt(studentToUpdate.examDuration, 10);
            if (isNaN(studentDurationMinutes)) {
                continue;
            }
    
            const newStartTimeMinutes = lastEndTimeMinutes;
            const newEndTimeMinutes = newStartTimeMinutes + studentDurationMinutes;
    
            const newStartTime = `${String(Math.floor(newStartTimeMinutes / 60)).padStart(2, '0')}:${String(newStartTimeMinutes % 60).padStart(2, '0')}`;
            const newEndTime = `${String(Math.floor(newEndTimeMinutes / 60)).padStart(2, '0')}:${String(newEndTimeMinutes % 60).padStart(2, '0')}`;
    
            studentToUpdate.examStartTime = newStartTime;
            studentToUpdate.examEndTime = newEndTime;
            updatedStudentList[i] = studentToUpdate;
    
            lastEndTimeMinutes = newEndTimeMinutes;
    
            try {
                const response = await fetch('/api/student/updateExamTime', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        studentId: studentToUpdate._id,
                        examStartTime: newStartTime,
                        examEndTime: newEndTime,
                        examName: examName,
                        className: className
                    }),
                });
    
                if (!response.ok) {
                    console.error(`Failed to update exam times for student ${studentToUpdate.name} in DB`);
                }
            } catch (error) {
                console.error('Error updating exam times for subsequent student:', error);
            }
        }
        setCurrentStudentList(updatedStudentList);
    
        const updatedMongoData = { ...mongoData };
        if (firstStudent && updatedMongoData && updatedMongoData[selectedClass]) {
            updatedMongoData[selectedClass].students = updatedStudentList;
            setMongoData(updatedMongoData);
        }
    };

    const formatTimeHM = formatTimeHoursMinutes;

    const handleFilterChange = (text: string) => {
        setFilterText(text);
    };

    const handleExamChange = (exam: string) => {
        setSelectedExam(exam); 
    };
    
    const handleClassChange = (className: string) => {
        setSelectedClass(className);
    };

    const updateFirstStudent = useCallback((data: StructuredData | null) => {
        if (data) {
            const classNames = Object.keys(data);
            if (classNames.length > 0) {
                const firstClassName = classNames[0];
                const firstClass = data[firstClassName];
                if (firstClass && firstClass.students && firstClass.students.length > 0) {
                    setCurrentStudentList(firstClass.students);
                    setCurrentStudentIndex(0);
                    setFirstStudent(firstClass.students[0]);
                } else {
                    setFirstStudent(null);
                    setCurrentStudentList([]);
                    setCurrentStudentIndex(0);
                }
            } else {
                setFirstStudent(null);
                setCurrentStudentList([]);
                setCurrentStudentIndex(0);
            }
        } else {
            setFirstStudent(null);
            setCurrentStudentList([]);
            setCurrentStudentIndex(0);
        }
    }, []);

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
                updateFirstStudent(data);

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
    }, [updateFirstStudent]);

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
                updateFirstStudent(data);

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

    }, [selectedExam, selectedClass, updateFirstStudent]);

    const handlePreviousStudent = () => {
        if (currentStudentList.length > 0) {
            const newIndex = currentStudentIndex > 0 ? currentStudentIndex - 1 : currentStudentList.length - 1;
            setCurrentStudentIndex(newIndex);
            setFirstStudent(currentStudentList[newIndex]);
        }
    };

    const handleNextStudent = () => {
        if (currentStudentList.length > 0) {
            const newIndex = currentStudentIndex < currentStudentList.length - 1 ? currentStudentIndex + 1 : 0;
            setCurrentStudentIndex(newIndex);
            setFirstStudent(currentStudentList[newIndex]);
        }
    };

    return (
        <div className={`${style.main}`}>
            <Header
                onFilterChange={handleFilterChange}
                isFilterActive={isHomePage}
                currentTime={headerCurrentTime}
            />
            <Monitor
                startTime={formatTimeHM(firstStudent?.auditStartTime || firstStudent?.examStartTime)}
                endTime={formatTimeHM(firstStudent?.auditEndTime || firstStudent?.examEndTime)}
                elapsedTime={formatTime(elapsedTime)}
                extraTime={formatTime(extraTime)}
                studentName={firstStudent?.name || "Loading..."}
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
                            <AuditButtons
                                onStart={handleStart}
                                onEnd={handleEnd}
                                onPreviousStudent={handlePreviousStudent}
                                onNextStudent={handleNextStudent}
                                examStartTime={firstStudent?.examStartTime}
                                currentTime={headerCurrentTime}
                            />
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