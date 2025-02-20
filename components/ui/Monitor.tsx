"use client"

import style from '@/styles/ui/monitor.module.css'
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

interface BreakStatusData {
    documentId: string;
    studentUUID: string;
    isBreakActive: boolean;
}

const Monitor: React.FC<MonitorProps> = ({ startTime, endTime, elapsedTime, extraTime, studentName, documentId, studentUUID }) => {
    const [extraTimeDisplay, setExtraTimeDisplay] = useState('none');
    const [isBrakeActive, setIsBrakeActive] = useState(false);
    const pusherClient = usePusher();

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
                    setIsBrakeActive(data.isBreakActive);
                }
            });

            return () => {
                channel.unbind_all();
                pusherClient.unsubscribe(channelName);
            };
        }
    }, [pusherClient, documentId, studentUUID]);

    return (
        <div className={`${style.main} ${isBrakeActive ? style.breakActive : ''}`}>
            <div className={`${style.monitor}`}>
                {isBrakeActive ? (
                    <div className={`${style.breakDisplay}`}>
                        <h1 className={`${style.breakText}`}>On Brake</h1>
                    </div>
                ) : (
                    <div className={`${style.monitorContent}`}>
                        <div className={`${style.student}`}>
                            <h1 className={`${style.studentName}`}>{studentName}</h1>
                        </div>
                        <div className={`${style.timers}`}>
                            <div className={`${style.timer}`}>
                                <h1 className={`${style.timerTitle}`}>Sāktais laiks: </h1>
                                <h1 className={`${style.time}`}>{startTime}</h1>
                            </div>
                            <div className={`${style.timer}`}>
                                <h1 className={`${style.timerTitle}`}>Beigšanas laiks: </h1>
                                <h1 className={`${style.time}`}>{endTime}</h1>
                            </div>
                        </div>
                        <div className={`${style.runtimes}`}>
                            <div className={`${style.runtimer}`}>
                                <h1>Aizņemtais laiks: </h1>
                                <h1>{elapsedTime || "00:00:00"}</h1>
                            </div>
                            <div className={`${style.runtimer1}`} style={{ display: extraTimeDisplay }}>
                                <h1>Papildus laiks: </h1>
                                <h1>+ {extraTime || "00:00:00"}</h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Monitor;