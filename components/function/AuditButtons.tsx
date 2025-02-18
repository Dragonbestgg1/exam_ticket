"use client"

import style from '@/styles/functions/audit.module.css'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useRef, useState, useEffect } from 'react';

interface AuditButtonsProps {
    onStart: (startTime: string) => void;
    onEnd: (endTime: string) => void;
    onPreviousStudent: () => void;
    onNextStudent: () => void;
    examStartTime: string | null | undefined;
    currentTime: string;
}

const AuditButtons: React.FC<AuditButtonsProps> = ({ onStart, onEnd, onPreviousStudent, onNextStudent, examStartTime, currentTime }) => {
    const leftArrowWrapperRef = useRef<HTMLSpanElement | null>(null);
    const rightArrowWrapperRef = useRef<HTMLSpanElement | null>(null);
    const [isStartActive, setIsStartActive] = useState<boolean>(false);
    const [isEndActive, setIsEndActive] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState(false);
    const [startDisabled, setStartDisabled] = useState<boolean>(false);

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

    return (
        <div className={`${style.main}`}>
            <div className={`${style.testing}`}>
                <button
                    className={`${style.start} ${isStartActive ? style.active : ''}`}
                    onClick={handleStartClick}
                    disabled={startDisabled}
                >
                    Sākt
                </button>
                <button
                    className={`${style.end} ${isEndActive ? style.active : ''}`}
                    onClick={handleEndClick}
                >
                    Beigt
                </button>
            </div>
            <div className={`${style.selector}`}>
                <button className={`${style.selectorButton}`} onClick={handleLeftClick}>
                    <span ref={leftArrowWrapperRef} style={{ display: 'inline-flex' }}>
                        <FaArrowLeft style={{ transition: 'transform 0.3s ease-out' }} />
                    </span>
                    {!isMobile && <span>Iepriekšējais</span>}
                </button>
                <button className={`${style.selectorButton}`} onClick={handleRightClick}>
                    {!isMobile && <span>Nākamais</span>}
                    <span ref={rightArrowWrapperRef} style={{ display: 'inline-flex' }}>
                        <FaArrowRight style={{ transition: 'transform 0.3s ease-out' }} />
                    </span>
                </button>
            </div>
        </div>
    )
}

export default AuditButtons;