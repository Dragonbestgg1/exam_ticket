"use client"

import style from '@/styles/ui/monitor.module.css'
import { useState, useEffect } from 'react';

interface MonitorProps {
    startTime: string;
    endTime: string;
    elapsedTime: string;
    extraTime: string;
    studentName: string;
}

const Monitor: React.FC<MonitorProps> = ({ startTime, endTime, elapsedTime, extraTime, studentName }) => {
    const [extraTimeDisplay, setExtraTimeDisplay] = useState('none');

    useEffect(() => {
        if (extraTime && extraTime !== "00:00:00" && !extraTime.startsWith("-")) {
            setExtraTimeDisplay('flex');
        } else {
            setExtraTimeDisplay('none');
        }
    }, [extraTime]);

    return (
        <div className={`${style.main}`}>
            <div className={`${style.monitor}`}>
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
        </div>
    )
}

export default Monitor;