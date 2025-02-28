"use client"

import style from '@/styles/ui/monitor.module.css'
import { useState, useEffect, useRef } from 'react';
import { usePusher } from '@/app/providers';

import { StudentRecord } from '@/types/types';

interface MonitorProps {
    startTime: string;
    endTime: string;
    elapsedTime: string;
    extraTime: string;
    studentName: string;
    documentId: string;
    studentUUID: string;
    isBrakeActive?: boolean;
    firstStudent: StudentRecord | null; // Use StudentRecord instead of StudentData
}

interface BreakStatusData {
    documentId: string;
    studentUUID: string;
    isBreakActive: boolean;
}

interface StudentData {
    _id: string;
    name: string;
    examDate: string;
    examStartTime: string;
    examDuration: number;
    examEndTime: string;
    className?: string; // Make this optional
}

const Monitor: React.FC<MonitorProps> = ({ 
    startTime, 
    endTime, 
    elapsedTime, 
    extraTime, 
    studentName, 
    documentId, 
    studentUUID, 
    isBrakeActive: initialIsBrakeActive = false,
    firstStudent // Now correctly typed as StudentRecord
}) => {

    const [extraTimeDisplay, setExtraTimeDisplay] = useState('none');
    const [currentIsBrakeActive, setCurrentIsBrakeActive] = useState(initialIsBrakeActive);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [currentStartTime, setCurrentStartTime] = useState(startTime);
    const [currentEndTime, setCurrentEndTime] = useState(endTime);
    const [currentElapsedTime, setCurrentElapsedTime] = useState(elapsedTime);
    const [currentExtraTime, setCurrentExtraTime] = useState(extraTime);


    const pusherClient = usePusher();

        const pusherClientRef = useRef(pusherClient);
    useEffect(() => {
        pusherClientRef.current = pusherClient;
    }, [pusherClient]);
    useEffect(() => {
        if (extraTime && extraTime !== "00:00:00" && !extraTime.startsWith("-")) {
            setExtraTimeDisplay('flex');
        } else {
            setExtraTimeDisplay('none');
        }
    }, [extraTime]);

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
        if (!pusherClientRef.current || !documentId || !studentUUID) return;
    
        console.log("Subscribing to Pusher channel: student-updates");
    
        const channelName = 'student-updates';
        const eventName = 'student-changed';
    
        const channel = pusherClientRef.current.subscribe(channelName);
    
        channel.unbind(eventName); // Ensure no duplicate bindings
    
        const handleStudentUpdate = async (data: { documentId: string; studentUUID: string; className: string }) => {
            console.log("handleStudentUpdate START - pusherClient:", pusherClientRef.current, "documentId:", documentId);
            if (data?.documentId === documentId) {
                console.log("Document IDs match - processing update");
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
                        return;
                    }
    
                    const { studentData } = await response.json();
                    console.log('Fetched student data:', studentData);
                    setStudentData(studentData);
    
                } catch (error) {
                    console.error('Error fetching student data:', error);
                }
            }
        };
    
        channel.bind(eventName, handleStudentUpdate);
    
        return () => {
            console.log("Unsubscribing from Pusher channel:", channelName);
            channel.unbind(eventName, handleStudentUpdate);
            pusherClientRef.current.unsubscribe(channelName);
        };
    
    }, [documentId, studentUUID]);
    

    const saveUserState = async (studentUUID: string, documentId: string, className: string) => {
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
            console.log('User state saved successfully:', { studentUUID, documentId, className });
        } catch (error) {
            console.error('Error saving user state:', error);
        }
    };

    useEffect(() => {
        if (studentData?.name && studentData?._id && documentId) {
            console.log('Triggering saveUserState with:', {
                studentUUID: studentData._id,
                documentId,
                className: studentData.className
            });
            saveUserState(studentData._id, documentId, studentData.className || '');
        }
    }, [studentData, documentId]);

    useEffect(() => {
        if (!pusherClientRef.current || !documentId || !studentUUID) return;
    
        const channel = pusherClientRef.current.subscribe('timer-channel');
        let timerInterval: NodeJS.Timeout | null = null;
    
        const handleTimerStop = async (data: { stopSignal: boolean; documentId: string; studentUUID: string; stopTimestamp: number }) => {
            if (data.documentId === documentId && data.studentUUID === studentUUID) {
                console.log('Timer stop signal received, stopping chronometer...');
                
                if (timerInterval) clearInterval(timerInterval);
    
                const stopTime = new Date(data.stopTimestamp);
                const formattedStopTime = stopTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                setCurrentEndTime(formattedStopTime);
    
                // Calculate the elapsed time
                const elapsedMs = data.stopTimestamp - new Date(startTime).getTime();
                const formattedElapsedTime = new Date(elapsedMs).toISOString().substr(11, 8);
                setCurrentElapsedTime(formattedElapsedTime);
    
                // Calculate extra time if applicable
                if (firstStudent?.examEndTime) {
                    const calculatedEndTimeMs = parseTimeToMilliseconds(firstStudent.examEndTime);
                    const calculatedStartTimeMs = parseTimeToMilliseconds(firstStudent.examStartTime);
                    const totalTimeMs = calculatedStartTimeMs + elapsedMs;
    
                    if (totalTimeMs > calculatedEndTimeMs) {
                        const extraMs = totalTimeMs - calculatedEndTimeMs;
                        const extraHours = Math.floor(extraMs / 3600000);
                        const extraMinutes = Math.floor((extraMs % 3600000) / 60000);
                        const extraSeconds = Math.floor((extraMs % 60000) / 1000);
                        setCurrentExtraTime(
                            `${String(extraHours).padStart(2, '0')}:${String(extraMinutes).padStart(2, '0')}:${String(extraSeconds).padStart(2, '0')}`
                        );
                    } else {
                        setCurrentExtraTime('00:00:00');
                    }
                }
    
                // Update MongoDB via API call
                try {
                    const response = await fetch('/api/student/updateAuditTime', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            studentId: studentUUID,
                            auditEndTime: formattedStopTime,
                            auditElapsedTime: formattedElapsedTime,
                            auditExtraTime: currentExtraTime,
                            documentId,
                        }),
                    });
    
                    if (!response.ok) {
                        console.error('Failed to update student times in MongoDB');
                    }
                } catch (error) {
                    console.error('Error updating student times in MongoDB:', error);
                }
            }
        };
    
        channel.bind('timer-stopped', handleTimerStop);
    
        return () => {
            channel.unbind('timer-stopped', handleTimerStop);
            pusherClientRef.current?.unsubscribe('timer-channel');
        };
    
    }, [documentId, studentUUID, firstStudent]);
    
    
    const parseTimeToMilliseconds = (timeString: string): number => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return (hours * 3600 + minutes * 60) * 1000;
    };
    

    return (
        <div className={`${style.main} ${currentIsBrakeActive ? style.breakActive : ''}`}>
            <div className={`${style.monitor}`}>
                {currentIsBrakeActive ? (
                    <div className={`${style.breakDisplay}`}>
                        <h1 className={`${style.breakText}`}>On Brake</h1>
                    </div>
                ) : (
                    <div className={`${style.monitorContent}`}>
                        <div className={`${style.student}`}>
                            <h1 className={`${style.studentName}`}>
                                {studentData?.name || studentName}
                            </h1>
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
                            <div className={`${style.runtimer1}`} style={{ display: extraTimeDisplay }}>
                                <h1>Papildus laiks: </h1>
                                <h1>+ {currentExtraTime || "00:00:00"}</h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Monitor;