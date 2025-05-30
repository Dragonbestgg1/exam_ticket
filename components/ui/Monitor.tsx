"use client"

import style from '@/styles/ui/monitor.module.css'
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePusher } from '@/app/providers';
import { StudentRecord } from '@/types/types';

interface MonitorProps {
    startTime: string;
    endTime: string;
    elapsedTime: string;
    studentName: string;
    documentId: string;
    studentUUID: string;
    isBrakeActive?: boolean;
    firstStudent: StudentRecord | null;
}

interface BreakStatusData {
    documentId: string;
    studentUUID: string;
    isBreakActive: boolean;
    className?: string;
}

interface StudentData {
    _id: string;
    name: string;
    examDate: string;
    examStartTime: string;
    examDuration: number;
    examEndTime: string;
    className: string;
}

const Monitor: React.FC<MonitorProps> = ({
    startTime,
    endTime,
    elapsedTime,
    studentName,
    documentId,
    studentUUID,
    isBrakeActive: initialIsBrakeActive = false,
}) => {
    const [currentIsBrakeActive, setCurrentIsBrakeActive] = useState(initialIsBrakeActive);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [currentStartTime, setCurrentStartTime] = useState(startTime);
    const [currentEndTime, setCurrentEndTime] = useState(endTime);
    const [currentElapsedTime, setCurrentElapsedTime] = useState(elapsedTime);

    const pusherClient = usePusher();
    const pusherClientRef = useRef(pusherClient);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        pusherClientRef.current = pusherClient;
    }, [pusherClient]);

    useEffect(() => {
        const fetchBreakStatus = async () => {
            if (!studentUUID || !documentId) {
                console.log('Skipping fetch: studentUUID or documentId is not available yet.');
                return;
            }
    
            try {
                console.log('Fetching break status...');
                console.log('Requesting with data:', { studentUUID, documentId });
    
                const response = await fetch('/api/exam-ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentUUID, documentId }),
                });
    
                console.log('Received response status:', response.status);
          
                if (!response.ok) {
                    console.error('Failed to fetch break status:', response.statusText);
                    const errorBody = await response.text();
                    console.error('Error response body:', errorBody);
                    return;
                }
          
                const { isBreakActive, startTime, endTime } = await response.json();
                console.log('Break status response:', { isBreakActive, startTime, endTime });
          
                if (isBreakActive) {
                    setCurrentIsBrakeActive(true);
                    setCurrentStartTime(startTime);
                    setCurrentEndTime(endTime);
                }
            } catch (error) {
                console.error('Error fetching break status:', error);
            }
        };

        const timer = setTimeout(() => {
            fetchBreakStatus();
        }, 500);
      
        return () => clearTimeout(timer);
    }, [studentUUID, documentId]);
    

    useEffect(() => {
        if (pusherClient && documentId && studentUUID) {
          const channelName = `exam-break-updates`;
          const eventName = 'break-status-changed';
    
          const channel = pusherClient.subscribe(channelName);
    
          channel.bind(eventName, (data: BreakStatusData) => {
            if (data && data.documentId === documentId && data.studentUUID === studentUUID) {
              setCurrentIsBrakeActive(data.isBreakActive);
            }
          });
    
          return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
          };
        }
    }, [pusherClient, documentId, studentUUID]);

    useEffect(() => {

        if (!pusherClient || !documentId) return;

        const channelName = 'student-updates';
        const eventName = 'student-changed';

        const channel = pusherClient.subscribe(channelName);

        channel.unbind(eventName);

        const handleStudentUpdate = async (data: { documentId: string; studentUUID: string; className: string }) => {
            if (data?.documentId === documentId) {
                try {
                    const response = await fetch('/api/student/fetch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            documentId: data.documentId,
                            className: data.className,
                            studentUUID: data.studentUUID,
                        }),
                    });

                    if (!response.ok) {
                        console.error('Failed to fetch student data:', response.statusText, response.status);
                        try {
                            const errorBody = await response.json();
                            console.error('Response body:', errorBody);
                        } catch (bodyError) {
                            console.error('Error reading response body:', bodyError);
                        }
                        return;
                    }

                    const { studentData } = await response.json();
                    setStudentData(studentData);

                    setCurrentStartTime(studentData.examStartTime || startTime);
                    setCurrentEndTime(studentData.examEndTime || endTime);
                    setCurrentElapsedTime(elapsedTime);

                } catch (error) {
                    console.error('Error fetching student data:', error);
                }
            }
        };

        channel.bind(eventName, handleStudentUpdate);

        return () => {
            channel.unbind(eventName, handleStudentUpdate);
            pusherClientRef.current.unsubscribe(channelName);
        };

    }, [documentId, studentUUID, pusherClient, startTime, endTime, elapsedTime]);

    const saveUserState = useCallback(async (studentUUID: string, documentId: string, className: string) => {
        try {
            await fetch('/api/user-state/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lastSelectedStudentId: studentUUID,
                    documentId,
                    className,
                }),
            });
        } catch (error) {
            console.error('Error saving user state:', error);
        }
    }, []);

    useEffect(() => {
        if (studentData?.name && studentData?._id && documentId) {
            console.log('Triggering saveUserState with:', {
                studentUUID: studentData._id,
                documentId,
                className: studentData.className
            });
            saveUserState(studentData._id, documentId, studentData.className || '');
        }
    }, [studentData, documentId, saveUserState]);

    useEffect(() => {
        if (!pusherClient || !documentId || !studentUUID) return;

        const channel = pusherClient.subscribe('timer-channel');

        channel.bind('timer-started', (data: { documentId: string; studentUUID: string }) => {
            if (data.documentId === documentId && data.studentUUID === studentUUID) {
                console.log("⏳ Timer started, resetting elapsed time to 00:00:00");
                setCurrentElapsedTime("00:00:00");
                if (timerRef.current) clearInterval(timerRef.current);
                const startTime = Date.now();
                timerRef.current = setInterval(() => {
                    const elapsedMs = Date.now() - startTime;
                    const elapsedHours = Math.floor(elapsedMs / 3600000);
                    const elapsedMinutes = Math.floor((elapsedMs % 3600000) / 60000);
                    const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
                    setCurrentElapsedTime(
                        `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`
                    );
                }, 1000);
            }
        });

        channel.bind('timer-stopped', (data: { documentId: string; studentUUID: string }) => {
            if (data.documentId === documentId && data.studentUUID === studentUUID) {
                console.log("⏹️ Timer stopped, fetching updated times from DB...");
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            }
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe('timer-channel');
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [pusherClient, documentId, studentUUID]);

    return (
        <div className={`${style.main} ${currentIsBrakeActive ? style.breakActive : ''}`}>
            <div className={`${style.monitor}`}>
                {currentIsBrakeActive ? (
                    <div className={`${style.breakDisplay}`}>
                        <h1 className={`${style.breakText}`}>On Break</h1>
                    </div>
                ) : (
                    <div className={`${style.monitorContent}`}>
                        <div className={`${style.student}`}>
                            <h1 className={`${style.studentName}`}>{studentData?.name || studentName}</h1>
                        </div>
                        <div className={`${style.timers}`}>
                            <div className={`${style.timer}`}>
                                <h1 className={`${style.timerTitle}`}>Sāktais laiks: </h1>
                                <h1 className={`${style.time}`}>{currentStartTime}</h1>
                            </div>
                            <div className={`${style.timer}`}>
                                <h1 className={`${style.timerTitle}`}>Beigšanas laiks: </h1>
                                <h1 className={`${style.time}`}>{currentEndTime}</h1>
                            </div>
                        </div>
                        <div className={`${style.runtimes}`}>
                            <div className={`${style.runtimer}`}>
                                <h1>Aizņemtais laiks: </h1>
                                <h1>{currentElapsedTime || "00:00:00"}</h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Monitor;
