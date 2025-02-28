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
    extraTime,
    studentName,
    documentId,
    studentUUID,
    isBrakeActive: initialIsBrakeActive = false,
    firstStudent
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
        console.log("useEffect START - pusherClient:", pusherClient, "documentId:", documentId);

        if (!pusherClient || !documentId) return;

        const channelName = 'student-updates';
        const eventName = 'student-changed';

        console.log("Subscribing to Pusher channel:", channelName);

        const channel = pusherClient.subscribe(channelName);

        channel.unbind(eventName);

        console.log("pusherClient:", pusherClient);
        console.log("documentId:", documentId);


        const handleStudentUpdate = async (data: { documentId: string; studentUUID: string; className: string }) => {
            console.log("handleStudentUpdate START - pusherClient:", pusherClient, "documentId:", documentId);
            console.log("Received student update via Pusher:", data.studentUUID);

            console.log("Pusher data documentId:", data.documentId);
            console.log("Component documentId:", documentId);
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
                        try {
                            const errorBody = await response.json();
                            console.error('Response body:', errorBody);
                        } catch (bodyError) {
                            console.error('Error reading response body:', bodyError);
                        }
                        return;
                    }

                    const { studentData } = await response.json();
                    console.log('Fetched student data:', studentData);
                    setStudentData(studentData);

                    setCurrentStartTime(studentData.examStartTime || startTime);
                    setCurrentEndTime(studentData.examEndTime || endTime);
                    setCurrentElapsedTime(elapsedTime);
                    setCurrentExtraTime(extraTime);


                    console.log('ending if statement');

                } catch (error) {
                    console.error('Error fetching student data:', error);
                }
            }
            console.log('finished handling student update');
        };

        console.log('finished loading Next student data');

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
        if (pusherClient && documentId && studentUUID) {
            const channel = pusherClient.subscribe('timer-channel');

            let timerInterval: NodeJS.Timeout | null = null;

            const handleTimerStart = (data: { startSignal: boolean; documentId: string; studentUUID: string }) => {
                if (data.documentId === documentId && data.studentUUID === studentUUID) {
                    console.log('Timer start signal received, starting chronometer...');

                    setCurrentElapsedTime('00:00:00');
                    let elapsedSeconds = 0;

                    if (timerInterval) clearInterval(timerInterval);

                    timerInterval = setInterval(() => {
                        elapsedSeconds++;
                        const hours = Math.floor(elapsedSeconds / 3600);
                        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
                        const seconds = elapsedSeconds % 60;
                        setCurrentElapsedTime(
                            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                        );
                    }, 1000);
                }
            };

            const handleTimerStop = (data: { stopSignal: boolean; documentId: string; studentUUID: string }) => {
                if (data.documentId === documentId && data.studentUUID === studentUUID) {
                    console.log('Timer stop signal received, stopping chronometer...');
                    if (timerInterval) clearInterval(timerInterval);
                }
            };

            channel.bind('timer-started', handleTimerStart);
            channel.bind('timer-stopped', handleTimerStop);

            return () => {
                if (timerInterval) clearInterval(timerInterval);
                channel.unbind('timer-started', handleTimerStart);
                channel.unbind('timer-stopped', handleTimerStop);
                pusherClient.unsubscribe('timer-channel');
            };
        }
    }, [pusherClient, documentId, studentUUID]);



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