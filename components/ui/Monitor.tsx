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
    firstStudent
}) => {
    const [currentIsBrakeActive, setCurrentIsBrakeActive] = useState(initialIsBrakeActive);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [currentStartTime, setCurrentStartTime] = useState(startTime);
    const [currentEndTime, setCurrentEndTime] = useState(endTime);
    const [currentElapsedTime, setCurrentElapsedTime] = useState(elapsedTime);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const pusherClient = usePusher();
    const pusherClientRef = useRef(pusherClient);
    useEffect(() => {
        pusherClientRef.current = pusherClient;
    }, [pusherClient]);

    useEffect(() => {
        if (!pusherClient || !documentId) return;

        const channel = pusherClient.subscribe('student-updates');
        const eventName = 'student-changed';

        const handleStudentUpdate = async (data: { documentId: string; studentUUID: string; className: string }) => {
            if (data.documentId === documentId) {
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
                        console.error('Failed to fetch student data:', response.statusText);
                        return;
                    }

                    const { studentData } = await response.json();
                    setStudentData(studentData);
                    setCurrentStartTime(studentData.examStartTime || startTime);
                    setCurrentEndTime(studentData.examEndTime || endTime);
                    setCurrentElapsedTime(studentData.auditElapsedTime || '00:00:00');
                } catch (error) {
                    console.error('Error fetching student data:', error);
                }
            }
        };

        channel.bind(eventName, handleStudentUpdate);

        return () => {
            channel.unbind(eventName, handleStudentUpdate);
            pusherClient.unsubscribe('student-updates');
        };
    }, [documentId, studentUUID, pusherClient]);

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
