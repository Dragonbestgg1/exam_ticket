"use client"

import style from '@/styles/functions/audit.module.css'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useRef, useState, useEffect } from 'react';
import { StudentRecord } from '@/types/types';

/* eslint-disable react-hooks/rules-of-hooks */

interface AuditButtonsProps {
    onStart: (startTime: string) => void;
    onEnd: (endTime: string) => void;
    onPreviousStudent: () => void;
    onNextStudent: () => void;
    examStartTime: string | null | undefined;
    currentTime: string;
    examName: string;
    className: string;
    documentId: string | null;
    firstStudent: StudentRecord | null;
}

const AuditButtons: React.FC<AuditButtonsProps> = ({
    firstStudent, onStart, onEnd, onPreviousStudent, onNextStudent, examStartTime, currentTime, examName, className, documentId
}) => {
    const leftArrowWrapperRef = useRef<HTMLSpanElement | null>(null);
    const rightArrowWrapperRef = useRef<HTMLSpanElement | null>(null);
    const [isStartActive, setIsStartActive] = useState<boolean>(false);
    const [isEndActive, setIsEndActive] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState(false);
    const [startDisabled, setStartDisabled] = useState<boolean>(false);
    const [selectedBrakeInterval, setSelectedBrakeInterval] = useState<string>('');
    const [isBreakActive, setIsBreakActive] = useState<boolean>(false);

    const timeIntervals: number[] = [];
    for (let i = 5; i <= 60; i += 5) {
        timeIntervals.push(i);
    }

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const checkStartTime = () => {
            if (currentTime && examStartTime) {
                const currentTimeParsed = parseTimeToMinutes(currentTime);
                const examStartTimeParsed = parseTimeToMinutes(examStartTime);
                setStartDisabled(currentTimeParsed < examStartTimeParsed);
            } else {
                setStartDisabled(false);
            }
        };
        checkStartTime();
    }, [currentTime, examStartTime]);

    const parseTimeToMinutes = (timeString: string): number => {
        if (!timeString) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const getCurrentTimeHHMM = (): string => {
        const roundTimeToNearestMinute = (date: Date): string => {
            const seconds = date.getSeconds();
            let minutes = date.getMinutes();
            let hours = date.getHours();

            if (seconds >= 25) {
                minutes++;
                if (minutes === 60) {
                    minutes = 0;
                    hours++;
                    if (hours === 24) {
                        hours = 0;
                    }
                }
            }
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };
        const now = new Date();
        return roundTimeToNearestMinute(now);
    };

    const handleLeftClick = () => {
        const arrowIcon = leftArrowWrapperRef.current?.querySelector('svg');
        if (arrowIcon) {
            arrowIcon.style.transform = 'translateX(-10px)';
            setTimeout(() => {
                if (arrowIcon) {
                    arrowIcon.style.transform = 'translateX(0)';
                }
            }, 300);
        }
        onPreviousStudent();
    };

    const handleRightClick = () => {
        const arrowIcon = rightArrowWrapperRef.current?.querySelector('svg');
        if (arrowIcon) {
            arrowIcon.style.transform = 'translateX(10px)';
            setTimeout(() => {
                if (arrowIcon) {
                    arrowIcon.style.transform = 'translateX(0)';
                }
            }, 300);
        }
        onNextStudent();
    };

    const handleStartClick = () => {
        if (!startDisabled && !isStartActive) {
            setIsStartActive(true);
            setIsEndActive(false);
            const startTime = getCurrentTimeHHMM();
            onStart(startTime);
        }
    };

    const handleEndClick = () => {
        if (!isEndActive) {
            setIsEndActive(true);
            setIsStartActive(false);
            const endTime = getCurrentTimeHHMM();
            onEnd(endTime);
        }
    };

    const handleBrakeIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBrakeInterval(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedBrakeInterval) {
            alert("Please select a brake interval.");
            return;
        }

        const brakeMinutes = parseInt(selectedBrakeInterval, 10);
        const currentTimeHHMM = getCurrentTimeHHMM();
        const brakeEndTime = new Date(new Date().getTime() + brakeMinutes * 60 * 1000);
        const brakeEndTimeHHMM = `${String(brakeEndTime.getHours()).padStart(2, '0')}:${String(brakeEndTime.getMinutes()).padStart(2, '0')}`;

        try {
            const response = await fetch('/api/brake', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    brakeMinutes: brakeMinutes,
                    startTime: currentTimeHHMM,
                    endTime: brakeEndTimeHHMM,
                    isBreakActive: true,
                    examName: examName,
                    className: className,
                    documentId: documentId,
                    studentUUID: firstStudent?._id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData?.message || `Failed to submit brake time. Status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setIsBreakActive(data.isBreakActive);
            alert(`Brake submitted successfully! Brake ends at ${brakeEndTimeHHMM}`);
            setSelectedBrakeInterval('');


        } catch (error: unknown) {
            let errorMessage = "Failed to submit brake time.";
            if (error instanceof Error) {
                errorMessage += ` Error: ${error.message}`;
            } else {
                errorMessage += ` Unknown error: ${String(error)}`;
            }
            alert(errorMessage);
        }
    };


    return (
        <div className={`${style.main}`}>
            <div className={`${style.testing}`}>
                <button
                    className={`${style.start} ${isStartActive ? style.active : ''}`}
                    onClick={handleStartClick}
                    disabled={startDisabled}
                    type="button"
                >
                    Sākt
                </button>
                <button
                    className={`${style.end} ${isEndActive ? style.active : ''}`}
                    onClick={handleEndClick}
                    type="button"
                >
                    Beigt
                </button>
            </div>
            <div className={`${style.alignment}`}>
                <div className={`${style.selector}`}>
                    <button className={`${style.selectorButton}`} onClick={handleLeftClick} type="button">
                        <span ref={leftArrowWrapperRef} style={{ display: 'inline-flex' }}>
                            <FaArrowLeft style={{ transition: 'transform 0.3s ease-out' }} />
                        </span>
                        {!isMobile && <span>Iepriekšējais</span>}
                    </button>
                    <button className={`${style.selectorButton}`} onClick={handleRightClick} type="button">
                        {!isMobile && <span>Nākamais</span>}
                        <span ref={rightArrowWrapperRef} style={{ display: 'inline-flex' }}>
                            <FaArrowRight style={{ transition: 'transform 0.3s ease-out' }} />
                        </span>
                    </button>
                </div>
                <form className={`${style.brakes}`} onSubmit={handleSubmit}>
                    <select className={`${style.dropdown}`} value={selectedBrakeInterval} onChange={handleBrakeIntervalChange} name="brakeInterval">
                        <option value="">Laiks</option>
                        {timeIntervals.map((interval) => (
                            <option key={interval} value={String(interval)}>
                                {interval} min
                            </option>
                        ))}
                    </select>
                    <button className={`${style.submitButton}`} type="submit">Pieteikt</button>
                </form>
                {isBreakActive}
            </div>
        </div>
    )
}

export default AuditButtons;