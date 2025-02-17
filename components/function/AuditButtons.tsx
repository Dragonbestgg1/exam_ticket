"use client"

import style from '@/styles/functions/audit.module.css'
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useRef, useState, useEffect } from 'react';

interface AuditButtonsProps {
    onStart: () => void;
    onEnd: () => void;
}

const AuditButtons: React.FC<AuditButtonsProps> = ({ onStart, onEnd }) => {
    const leftArrowWrapperRef = useRef<HTMLSpanElement | null>(null);
    const rightArrowWrapperRef = useRef<HTMLSpanElement | null>(null);
    const [isStartActive, setIsStartActive] = useState<boolean>(false);
    const [isEndActive, setIsEndActive] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Set initial value
        handleResize();

        // Add event listener for window resize
        window.addEventListener('resize', handleResize);

        // Clean up event listener on unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);


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
    };

    const handleStartClick = () => {
        setIsStartActive(!isStartActive);
        setIsEndActive(false);
        onStart();
    };

    const handleEndClick = () => {
        setIsEndActive(!isEndActive);
        setIsStartActive(false);
        onEnd();
    };

    return (
        <div className={`${style.main}`}>
            <div className={`${style.testing}`}>
                <button
                    className={`${style.start} ${isStartActive ? style.active : ''}`}
                    onClick={handleStartClick}
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
                    {!isMobile && <span>Iepriekšējais</span>} {/* Conditionally render text */}
                </button>
                <button className={`${style.selectorButton}`} onClick={handleRightClick}>
                    {!isMobile && <span>Nākamais</span>} {/* Conditionally render text */}
                    <span ref={rightArrowWrapperRef} style={{ display: 'inline-flex' }}>
                        <FaArrowRight style={{ transition: 'transform 0.3s ease-out' }} />
                    </span>
                </button>
            </div>
        </div>
    )
}

export default AuditButtons;