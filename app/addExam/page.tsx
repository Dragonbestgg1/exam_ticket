"use client"

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/ui/Header'
import style from '@/styles/pages/addExam.module.css'

interface ExamNameData {
    _id: string;
    examName: string;
    examDate: string;
    examStartTime: string;
    examDuration: string;
}

export default function AddExam() {
    const [examName, setExamName] = useState('');
    const [examDate, setExamDate] = useState('');
    const [examClass, setExamClass] = useState('');
    const [examStart, setExamStart] = useState('');
    const [examDuration, setExamDuration] = useState('');
    const [studentsText, setStudentsText] = useState('');
    const [examNames, setExamNames] = useState<ExamNameData[]>([]);
    const [loadingExams, setLoadingExams] = useState(false);
    const [errorLoadingExams, setErrorLoadingExams] = useState<string | null>(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [filteredExamNames, setFilteredExamNames] = useState<ExamNameData[]>([]);
    const examNameInputRef = useRef<HTMLInputElement | null>(null);

    const [examNameError, setExamNameError] = useState<string | null>(null);
    const [examDateError, setExamDateError] = useState<string | null>(null);
    const [examClassError, setExamClassError] = useState<string | null>(null);
    const [examStartError, setExamStartError] = useState<string | null>(null);
    const [examDurationError, setExamDurationError] = useState<string | null>(null);
    const [studentsTextError, setStudentsTextError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExamNames = async () => {
            setLoadingExams(true);
            setErrorLoadingExams(null);
            try {
                const response = await fetch('/api/exam-names');
                if (!response.ok) {
                    throw new Error(`Failed to fetch exam names: ${response.statusText}`);
                }
                const data: ExamNameData[] = await response.json();
                setExamNames(data);
                setFilteredExamNames(data);
            } catch (error: unknown) {
                let errorMessage = 'Failed to load exam names.';
                if (error instanceof Error) {
                    errorMessage = error.message || errorMessage;
                }
                setErrorLoadingExams(errorMessage);
                setExamNames([]);
                setFilteredExamNames([]);
            } finally {
                setLoadingExams(false);
            }
        };

        fetchExamNames();
    }, []);

    const handleExamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setExamName(inputValue);
        setExamNameError(null);

        const filtered = examNames.filter(exam => exam.examName.toLowerCase().includes(inputValue.toLowerCase()));
        setFilteredExamNames(filtered);
        setIsDropdownVisible(true);
    };

    const handleExamDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExamDate(e.target.value);
        setExamDateError(null);
    };

    const handleExamClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExamClass(e.target.value);
        setExamClassError(null);
    };

    const handleExamStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExamStart(e.target.value);
        setExamStartError(null);
    };

    const handleExamDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExamDuration(e.target.value);
        setExamDurationError(null);
    };

    const handleStudentsTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setStudentsText(e.target.value);
        setStudentsTextError(null);
    };

    const handleExamNameBlur = () => {
        setTimeout(() => {
            setIsDropdownVisible(false);
        }, 300);
    };

    const handleExamNameFocus = () => {
        setIsDropdownVisible(true);
    };

    const selectExamFromDropdown = (selectedExam: ExamNameData) => {
        setExamName(selectedExam.examName || '');
        setExamStart(selectedExam.examStartTime || '');
        setExamDuration(selectedExam.examDuration || '');

        setStudentsText('');
        setIsDropdownVisible(false);
        examNameInputRef.current?.blur();
    };

    const validateForm = () => {
        const errors: { [key: string]: string | null } = {}; // Use const

        if (!examName.trim()) {
            errors.examName = 'Eksāmena nosaukums ir obligāts!';
        }
        if (!examDate.trim()) {
            errors.examDate = 'Eksāmena datums ir obligāts!';
        }
        if (!examClass.trim()) {
            errors.examClass = 'Kurss ir obligāts!';
        }
        if (!examStart.trim()) {
            errors.examStart = 'Eksāmena sākuma laiks ir obligāts!';
        }
        if (!examDuration.trim()) {
            errors.examDuration = 'Eksāmena ilgums ir obligāts!';
        } else if (isNaN(Number(examDuration))) {
            errors.examDuration = 'Eksāmena ilgumam jābūt skaitlim!';
        } else if (Number(examDuration) <= 0) {
            errors.examDuration = 'Eksāmena ilgumam jābūt pozitīvam skaitlim!';
        }
        if (!studentsText.trim()) {
            errors.studentsText = 'Skolēnu saraksts ir obligāts!';
        }

        return errors;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setExamNameError(null);
        setExamDateError(null);
        setExamClassError(null);
        setExamStartError(null);
        setExamDurationError(null);
        setStudentsTextError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setExamNameError(validationErrors.examName || null);
            setExamDateError(validationErrors.examDate || null);
            setExamClassError(validationErrors.examClass || null);
            setExamStartError(validationErrors.examStart || null);
            setExamDurationError(validationErrors.examDuration || null);
            setStudentsTextError(validationErrors.studentsText || null);
            return;
        }

        const examData = {
            examName: examName,
            examDate: examDate,
            examClass: examClass,
            examStartTime: examStart,
            examDuration: examDuration,
            studentsText: studentsText
        };

        try {
            const response = await fetch('/api/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(examData),
            });

            if (response.ok) {
                alert('Eksāmens veiksmīgi pievienots!');
                setExamName('');
                setExamDate('');
                setExamClass('');
                setExamStart('');
                setExamDuration('');
                setStudentsText('');
            } else {
                alert('Kļūda pievienojot eksāmenu. Lūdzu, mēģiniet vēlreiz.');
            }
        } catch (error) {
            console.error("Error submitting exam:", error);
            alert('Kļūda sazinoties ar serveri. Lūdzu, mēģiniet vēlreiz.');

        }
    };

    return (
        <div className={`${style.main}`}>
            <Header />
            <form className={`${style.form}`} onSubmit={handleSubmit}>
                <div className={`${style.mainInfo}`}>
                    <div className={`${style.input}`}>
                        <label htmlFor="examName">Eksāmena nosaukums</label>
                        <div className={style.inputWithDropdown}>
                            <input
                                type="text"
                                id="examName"
                                className={`${style.inputCon}`}
                                value={examName}
                                onChange={handleExamNameChange}
                                onBlur={handleExamNameBlur}
                                onFocus={handleExamNameFocus}
                                ref={examNameInputRef}
                            />
                            {isDropdownVisible && filteredExamNames.length > 0 && (
                                <ul className={style.dropdown}>
                                    {filteredExamNames.map((exam) => (
                                        <li key={exam._id} onClick={() => selectExamFromDropdown(exam)}>{exam.examName}</li>
                                    ))}
                                </ul>
                            )}
                            {loadingExams && isDropdownVisible && <div className={style.dropdown}>Loading exams...</div>}
                            {errorLoadingExams && isDropdownVisible && <div className={`${style.dropdown} ${style.error}`}>{errorLoadingExams}</div>}
                            {isDropdownVisible && filteredExamNames.length === 0 && !loadingExams && !errorLoadingExams && examName.trim() !== "" && <div className={style.dropdown}>No matching exams found.</div>}
                        </div>
                        {examNameError && <p className={style.errorText}>{examNameError}</p>}
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDate">Eksāmena datums</label>
                        <input
                            type="date"
                            id="examDate"
                            className={`${style.inputCon}`}
                            value={examDate}
                            onChange={handleExamDateChange}
                        />
                        {examDateError && <p className={style.errorText}>{examDateError}</p>}
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="class">Kurss</label>
                        <input
                            type="text"
                            id="class"
                            className={`${style.inputCon}`}
                            value={examClass}
                            onChange={handleExamClassChange}
                        />
                        {examClassError && <p className={style.errorText}>{examClassError}</p>}
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examStart">Eksāmena sākums</label>
                        <input
                            type="time"
                            id="examStart"
                            className={`${style.inputCon}`}
                            value={examStart}
                            onChange={handleExamStartChange}
                        />
                        {examStartError && <p className={style.errorText}>{examStartError}</p>}
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDuration">Skolēna atvēlētais laiks (min)</label>
                        <input
                            type="number"
                            id="examDuration"
                            className={`${style.inputCon}`}
                            value={examDuration}
                            onChange={handleExamDurationChange}
                        />
                        {examDurationError && <p className={style.errorText}>{examDurationError}</p>}
                    </div>
                </div>
                <textarea
                    placeholder='Lūgums skolēnus atdalīt ar komatu'
                    className={`${style.textarea}`}
                    value={studentsText}
                    onChange={handleStudentsTextChange}
                />
                {studentsTextError && <p className={style.errorText}>{studentsTextError}</p>}
                <div className={`${style.submitContainer}`}>
                    <button type='submit' className={`${style.submit}`}>Pievienot</button>
                </div>
            </form>
        </div>
    )
}