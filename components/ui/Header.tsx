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
}

export default function Header({ onFilterChange, isFilterActive }: HeaderProps) {
    const [time, setTime] = useState('');
    const [colonVisible, setColonVisible] = useState(true);
    const [filterInputActive, setFilterInputActive] = useState(false);
    const { data: session } = useSession();
    const [filterInput, setFilterInput] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };

        updateTime();

        const timeUpdateIntervalId = setInterval(updateTime, 1000);

        const colonBlinkIntervalId = setInterval(() => {
            setColonVisible(prevColonVisible => !prevColonVisible);
        }, 500);

        return () => {
            clearInterval(timeUpdateIntervalId);
            clearInterval(colonBlinkIntervalId);
        };
    }, []);

    const [hours, minutes] = time.split(':') || ['', ''];

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
                <span>{hours}</span>
                <span style={{ visibility: colonVisible ? 'visible' : 'hidden' }}>:</span>
                <span>{minutes}</span>
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