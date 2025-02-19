// Header.tsx
'use client';

import Link from 'next/link';
import style from '@/styles/ui/header.module.css'
import { LuFilter } from "react-icons/lu";
import { IoHome } from "react-icons/io5";
import { GiExitDoor, GiEntryDoor } from "react-icons/gi";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { PiExam } from "react-icons/pi";

interface HeaderProps {
    onFilterChange?: (filterText: string) => void;
    isFilterActive?: boolean;
    currentTime: string;
}

export default function Header({ onFilterChange, isFilterActive }: HeaderProps) {
    const [colonVisible, setColonVisible] = useState(true);
    const [filterInputActive, setFilterInputActive] = useState(false);
    const { data: session } = useSession();
    const [filterInput, setFilterInput] = useState('');

    useEffect(() => {

        const colonBlinkIntervalId = setInterval(() => {
            setColonVisible(prevColonVisible => !prevColonVisible);
        }, 500);

        return () => {
            clearInterval(colonBlinkIntervalId);
        };
    }, []);

    const [headerTimeHours, setHeaderTimeHours] = useState<string>('');
    const [headerTimeMinutes, setHeaderTimeMinutes] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
    
            const hours = now.toLocaleTimeString([], { hour: '2-digit', hour12: false });
            const minutes = String(now.getMinutes()).padStart(2, '0');
            setHeaderTimeHours(hours);
            setHeaderTimeMinutes(minutes);
        };
    
        updateTime();
        const timeUpdateIntervalId = setInterval(updateTime, 1000);
    
        return () => {
            clearInterval(timeUpdateIntervalId);
        };
    }, []);


    const handleFilterClick = () => {
        setFilterInputActive(!filterInputActive);
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilterInput(value);
        if (onFilterChange) {
            onFilterChange(value);
        }
    };

    return (
        <header className={`${style.header}`}>
            <nav className={`${style.nav}`}>
                <Link href="/" className={`${style.home}`}><IoHome /></Link>
                {session && session.user ? (
                    <>
                        <button onClick={handleLogout} className={`${style.auth} ${style.logoutButton}`}>
                            <GiEntryDoor />
                        </button>
                        <Link href="/addExam" className={`${style.exam}`}><PiExam /></Link>
                    </>
                ) : (
                    <Link href="/auth" className={`${style.auth}`}>
                        <GiExitDoor />
                    </Link>
                )}
            </nav>
            <h1 className={`${style.title}`}>
                <span>{headerTimeHours}</span>
                <span style={{ visibility: colonVisible ? 'visible' : 'hidden' }}>:</span>
                <span>{headerTimeMinutes}</span>
            </h1>
            {isFilterActive && (
                <div className={`${style.search}`}>
                    <button className={`${style.filter} ${filterInputActive ? style.active : ''}`} onClick={handleFilterClick}>
                        <LuFilter />
                    </button>
                    <input
                        type="text"
                        className={`${style.src} ${filterInputActive ? style.active : ''}`}
                        placeholder="Search name..."
                        value={filterInput}
                        onChange={handleInputChange}
                    />
                </div>
            )}
        </header>
    );
}