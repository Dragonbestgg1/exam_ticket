'use client';

import Link from 'next/link';
import style from '@/styles/ui/header.module.css'
import { LuFilter } from "react-icons/lu";
import { IoHome } from "react-icons/io5";
import { GiExitDoor, GiEntryDoor } from "react-icons/gi";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
    const [time, setTime] = useState('');
    const [colonVisible, setColonVisible] = useState(true);
    const [isFilterActive, setIsFilterActive] = useState(false);
    const { data: session } = useSession();

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
        setIsFilterActive(!isFilterActive);
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <header className={`${style.header}`}>
            <nav className={`${style.nav}`}>
                <Link href="/" className={`${style.home}`}><IoHome /></Link>
                {session && session.user ? ( 
                    <button onClick={handleLogout} className={`${style.auth} ${style.logoutButton}`}>
                        <GiEntryDoor />
                    </button>
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
            <div className={`${style.search}`}>
                <button className={`${style.filter}`} onClick={handleFilterClick}>
                    <LuFilter />
                </button>
                <input
                    type="text"
                    className={`${style.src} ${isFilterActive ? style.active : ''}`}
                />
            </div>
        </header>
    );
}