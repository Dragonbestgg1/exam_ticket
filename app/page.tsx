"use client"

import BrakeStatusComponent from '@/components/function/BrakeStatusComponent';
import Header from '@/components/ui/Header';
import Monitor from '@/components/ui/Monitor';
import Listing from '@/components/function/Listing';
import AuditButtons from '@/components/function/AuditButtons';
import style from '@/styles/pages/page.module.css';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { StructuredData, StudentRecord } from '@/types/types';
import { usePusher } from '@/app/providers';


// =========================
// Authentication Component Functions (useUserAuthentication)
// =========================

const useUserAuthentication = () => {
    const session = useSession();
    const isAuthenticated = !!session?.data;
    return isAuthenticated;
};


// =========================
// General Utility Functions (Used across components)
// =========================

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


// =========================
// Page Component (HomePage) - State and Initialization
// =========================

export default function HomePage() {
    const isAuthenticated = useUserAuthentication();
    const [filterText, setFilterText] = useState<string>('');
    const pathname = usePathname();
    const isHomePage = pathname === '/';
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
    const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
    const [isBrakeActiveFromPusher, setIsBrakeActiveFromPusher] = useState(false);
    const pusherClient = usePusher();
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

    const formatHM = formatTimeHoursMinutes;


    // =========================
    // Header Component Functions (useEffect, updateTime)
    // =========================

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setHeaderCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const timeUpdateIntervalId = setInterval(updateTime, 1000);
        return () => clearInterval(timeUpdateIntervalId);
    }, []);

    interface ExamUpdateData {
        documentId: string;
        selectedClass?: string;
    }


    // =========================
    // Monitor Component Functions (useEffect for Timer, handleStart, handleEnd)
    // =========================

    useEffect(() => {
        if (isRunning) {
            timerInterval.current = setInterval(() => {
                const currentElapsedTime = Date.now() - timerStartTime;
                setElapsedTime(currentElapsedTime);
                if (firstStudent?.examEndTime && firstStudent?.examStartTime) {
                    const calculatedEndTimeMsForStudent = parseTimeToMilliseconds(firstStudent.examEndTime);
                    const calculatedStartTimeMsForStudent = parseTimeToMilliseconds(firstStudent.examStartTime);
                    const totalTimeMs = calculatedStartTimeMsForStudent + currentElapsedTime;
                    setExtraTime(Math.max(0, totalTimeMs - calculatedEndTimeMsForStudent));
                }
            }, 1000);
        } else {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
            timerInterval.current = null;
        }
        return () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        };
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
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
        }
        timerInterval.current = null;
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

    const handleBrakeStatusChange = useCallback((brakeActive: boolean) => {
        setIsBrakeActiveFromPusher(brakeActive);
    }, [setIsBrakeActiveFromPusher]);


    // =========================
    // Pusher Exam Selection Synchronization
    // =========================

    useEffect(() => {
        if (pusherClient) {
            const channelName = 'exam-updates';
            const eventName = 'exam-changed';
            const channel = pusherClient.subscribe(channelName);
            channel.bind(eventName, (data: ExamUpdateData) => {
                if (data && data.documentId) {
                    setSelectedDocumentId(data.documentId);
                    if (data.selectedClass) {
                        setSelectedClass(data.selectedClass);
                    }
                    console.log("Exam selection updated via Pusher:", data);
                }
            });
            return () => {
                channel.unbind_all();
                pusherClient.unsubscribe(channelName);
            };
        }
    }, [pusherClient]);


    // =========================
    // Listing Component Functions (handleFilterChange, handleExamChange, handleClassChange)
    // =========================

    const handleFilterChange = (text: string) => {
        setFilterText(text);
    };

    const handleExamChange = (exam: string) => {
        setSelectedExam(exam);
        setSelectedDocumentId(null);
        fetchData(null, exam, selectedClass);
    };

    const handleClassChange = (className: string) => {
        setSelectedClass(className);
        setSelectedDocumentId(null);
        fetchData(null, selectedExam, className);
    };


    // =========================
    // Data Fetching and Student Selection Functions (useEffect for Data Fetch, updateFirstStudent, handlePreviousStudent, handleNextStudent, fetchFilteredData, fetchData)
    // =========================

    const updateFirstStudent = useCallback((data: StructuredData | null) => {
        if (data) {
            const classNames = Object.keys(data);
            if (classNames.length > 0) {
                const firstClassName = classNames[0];
                const firstClass = data[firstClassName];
                if (firstClass && firstClass.students && firstClass.students.length > 0) {
                    const firstStudentData = firstClass.students[0];
                    setCurrentStudentList(firstClass.students);
                    setCurrentStudentIndex(0);
                    setFirstStudent(firstStudentData);
                    setCurrentDocumentId(firstClass._id || null);
                } else {
                    setFirstStudent(null);
                    setCurrentStudentList([]);
                    setCurrentStudentIndex(0);
                    setCurrentDocumentId(null);
                }
            } else {
                setFirstStudent(null);
                setCurrentStudentList([]);
                setCurrentStudentIndex(0);
                setCurrentDocumentId(null);
            }
        } else {
            setFirstStudent(null);
            setCurrentStudentList([]);
            setCurrentStudentIndex(0);
            setCurrentDocumentId(null);
        }
    }, []);


    // =========================
    // Data Fetching and Student Selection Functions (useEffect for Data Fetch, updateFirstStudent, handlePreviousStudent, handleNextStudent, fetchFilteredData, fetchData)
    // =========================

    const fetchData = useCallback(async (documentId?: string | null, examFilter?: string, classFilter?: string) => {
        setLoadingData(true);
        setErrorLoadingData(null);
        setTimeoutError(false);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            setTimeoutError(true);
        }, 8000);
        try {
            let mongoResponse;
            let queryString = "";
            if (documentId) {
                const examDataResponse = await fetch(`/api/exam/data?documentId=${documentId}`, { signal: controller.signal });
                if (!examDataResponse.ok) {
                    throw new Error(`HTTP error! status: ${examDataResponse.status} - Exam Data for documentId: ${documentId}`);
                }
                const examData = await examDataResponse.json();
                mongoResponse = {
                    ok: true,
                    json: async () => {
                        const structuredData: StructuredData = {};
                        if (examData && examData.exam) {
                            structuredData[examData.exam.examName] = examData.exam;
                        }
                        return structuredData;
                    }
                };
            } else {
                if (examFilter || classFilter) {
                    queryString = new URLSearchParams({
                        exam: examFilter || '',
                        class: classFilter || '',
                    }).toString();
                    mongoResponse = await fetch(`/api/filtered-mongo-data?${queryString}`, { signal: controller.signal });
                } else {
                    mongoResponse = await fetch('/api/mongo-data', { signal: controller.signal });
                }
                if (!mongoResponse.ok) {
                    throw new Error(`HTTP error! status: ${mongoResponse.status} - Mongo Data (Filtered or All)`);
                }
            }
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
            if (mongoResponse.ok) {
                const data: StructuredData = await mongoResponse.json();
                setMongoData(data);
                updateFirstStudent(data);
            } else {
                throw new Error(`Mongo data response was not ok (status: ${mongoResponse.status})`);
            }
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                setErrorLoadingData(new Error('Request timed out'));
            } else if (error instanceof Error) {
                setErrorLoadingData(error);
            } else {
                setErrorLoadingData(new Error('An unknown error occurred'));
            }
        } finally {
            clearTimeout(timeoutId);
            setLoadingData(false);
        }
    }, [updateFirstStudent]);

    useEffect(() => {
        fetchData(selectedDocumentId, selectedExam, selectedClass);
    }, [selectedDocumentId, fetchData, selectedExam, selectedClass]);

    useEffect(() => {
        const fetchInitialSelection = async () => {
            try {
                const response = await fetch('/api/exam/current-selection');
                if (response.ok) {
                    const selectionData = await response.json();
                    if (selectionData && selectionData.documentId) {
                        setSelectedDocumentId(selectionData.documentId);
                        if (selectionData.selectedClass) {
                            setSelectedClass(selectionData.selectedClass);
                        }
                    } else {
                        fetchData();
                    }
                } else {
                    fetchData();
                }
            } catch (error: unknown) {
                const caughtError = error;
                console.error('Error updating exam times for subsequent student:', caughtError);
            }
        };
        fetchInitialSelection();
    }, [fetchData]);

    useEffect(() => {
        if (selectedDocumentId) {
            fetchData(selectedDocumentId);
        } else {
            fetchData();
        }
    }, [selectedDocumentId, fetchData]);

    const handlePreviousStudent = () => {
        if (currentStudentList.length > 0) {
            const newIndex = currentStudentIndex > 0 ? currentStudentIndex - 1 : currentStudentList.length - 1;
            setCurrentStudentIndex(newIndex);
            setFirstStudent(currentStudentList[newIndex]);
            setCurrentDocumentId(currentStudentList[newIndex]._id?.toString() || null);
        }
    };

    const handleNextStudent = () => {
        if (currentStudentList.length > 0) {
            const newIndex = currentStudentIndex < currentStudentList.length - 1 ? currentStudentIndex + 1 : 0;
            setCurrentStudentIndex(newIndex);
            setFirstStudent(currentStudentList[newIndex]);
            setCurrentDocumentId(currentStudentList[newIndex]._id?.toString() || null);
        }
    };


    // =========================
    // Time Update Functions (updateSubsequentStudentTimes) - Used by AuditButtons and potentially data updates
    // =========================

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
        let lastEndTimeMinutes = currentExamEndTimeParsed;
        const updatedStudentList = [...currentStudentList];
        const studentsToUpdate = [];
        for (let i = currentIndex + 1; i < updatedStudentList.length; i++) {
            const studentToUpdate = updatedStudentList[i];
            if (!studentToUpdate) continue;
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
            studentsToUpdate.push({
                studentId: studentToUpdate._id,
                examStartTime: newStartTime,
                examEndTime: newEndTime,
                examName: examName,
                className: className
            });
            lastEndTimeMinutes = newEndTimeMinutes;
        }
        setCurrentStudentList(updatedStudentList);
        if (studentsToUpdate.length > 0) {
            try {
                const response = await fetch('/api/student/batchUpdateExamTime', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ updates: studentsToUpdate }),
                });
                if (!response.ok) {
                    console.error(`Failed to update exam times for multiple students in DB (batch update)`);
                }
            } catch (error) {
                console.error('Error updating exam times for subsequent students (batch update):', error);
            }
        }
        const updatedMongoData = { ...mongoData };
        if (firstStudent && updatedMongoData && updatedMongoData[selectedClass]) {
            updatedMongoData[selectedClass].students = updatedStudentList;
            setMongoData(updatedMongoData);
        }
    };


    // =========================
    // JSX Rendering -  Organized by Component Usage and conditional rendering
    // =========================

    return (
        <div className={`${style.main}`}>
            <Header
                onFilterChange={handleFilterChange}
                isFilterActive={isHomePage}
                currentTime={headerCurrentTime}
            />
            <BrakeStatusComponent
                itemId="your-item-id"
                channelName="liked-bird-373"
                eventName="brake-event"
                onBrakeStatusChange={handleBrakeStatusChange}
            />
            <Monitor
                startTime={formatHM(firstStudent?.auditStartTime || firstStudent?.examStartTime)}
                endTime={formatHM(firstStudent?.auditEndTime || firstStudent?.examEndTime)}
                elapsedTime={formatTime(elapsedTime)}
                extraTime={formatTime(extraTime)}
                documentId={currentDocumentId}
                studentUUID={firstStudent?._id}
                isBrakeActive={isBrakeActiveFromPusher}
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
                                examName={selectedExam}
                                className={selectedClass}
                                documentId={selectedDocumentId}
                                firstStudent={firstStudent}
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
