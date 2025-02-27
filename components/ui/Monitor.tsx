"use client";

import style from '@/styles/ui/monitor.module.css';
import { useState, useEffect } from 'react';
import { usePusher } from '@/app/providers';

interface MonitorProps {
    startTime: string;
    endTime: string;
    elapsedTime: string;
    extraTime: string;
    studentName: string;
    documentId: string;
    studentUUID: string;
    isBrakeActive?: boolean;
}

interface StudentData {
    _id: string;
    name: string;
    examDate: string;
    examStartTime: string;
    examDuration: number;
    examEndTime: string;
}

const Monitor: React.FC<MonitorProps> = ({
    startTime,
    endTime,
    elapsedTime,
    extraTime,
    studentName,
    documentId,
    studentUUID,
    isBrakeActive = false,
}) => {
    const [extraTimeDisplay, setExtraTimeDisplay] = useState('none');
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [currentStartTime, setCurrentStartTime] = useState(startTime);
    const [currentEndTime, setCurrentEndTime] = useState(endTime);
    const [currentElapsedTime, setCurrentElapsedTime] = useState(elapsedTime);
    const [currentExtraTime, setCurrentExtraTime] = useState(extraTime);
    const [currentBrakeStatus, setCurrentBrakeStatus] = useState(isBrakeActive);

    const pusherClient = usePusher();

    useEffect(() => {
        if (extraTime && extraTime !== "00:00:00" && !extraTime.startsWith("-")) {
            setExtraTimeDisplay('flex');
        } else {
            setExtraTimeDisplay('none');
        }
    }, [extraTime]);

    useEffect(() => {
        if (!pusherClient || !documentId) return;

        const channelName = 'student-updates';
        const eventName = 'student-changed';

        console.log("Subscribing to Pusher channel:", channelName);

        const channel = pusherClient.subscribe(channelName);

        channel.unbind(eventName);

        const handleStudentUpdate = async (data: { documentId: string; studentUUID: string; className: string }) => {
            if (data?.documentId === documentId) {
                console.log("Received student update via Pusher:", data.studentUUID);

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
                    console.log('Fetched student data:', studentData);
                    setStudentData(studentData);

                    // Update all relevant state variables with new data
                    setCurrentStartTime(studentData.examStartTime || startTime);
                    setCurrentEndTime(studentData.examEndTime || endTime);
                    setCurrentElapsedTime(elapsedTime);
                    setCurrentExtraTime(extraTime);
                    setCurrentBrakeStatus(isBrakeActive);

                } catch (error) {
                    console.error('Error fetching student data:', error);
                }
            }
        };

        channel.bind(eventName, handleStudentUpdate);

        return () => {
            console.log("Unsubscribing from Pusher channel:", channelName);
            channel.unbind(eventName, handleStudentUpdate);
            pusherClient.unsubscribe(channelName);
        };

    }, [pusherClient, documentId]);

    return (
        <div className={`${style.main} ${currentBrakeStatus ? style.breakActive : ''}`}>
            <div className={`${style.monitor}`}>
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
            </div>
        </div>
    );
};

export default Monitor;
