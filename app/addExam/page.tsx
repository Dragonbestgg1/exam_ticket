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
                console.error('Error fetching exam names:', error);
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

        const filtered = examNames.filter(exam => exam.examName.toLowerCase().includes(inputValue.toLowerCase()));
        setFilteredExamNames(filtered);
        setIsDropdownVisible(true);
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
        console.log("selectExamFromDropdown called with:", selectedExam);

        setExamName(selectedExam.examName);
        setExamDate(selectedExam.examDate);
        setExamStart(selectedExam.examStartTime);
        setExamDuration(selectedExam.examDuration);
        setStudentsText('');
        setIsDropdownVisible(false);
        examNameInputRef.current?.blur();
        console.log("State after selection:", {
            examName,
            examDate,
            examStart,
            examDuration
        });
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

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
                console.log('Exam added successfully!');
                alert('Eksāmens veiksmīgi pievienots!');
                setExamName('');
                setExamDate('');
                setExamClass('');
                setExamStart('');
                setExamDuration('');
                setStudentsText('');
            } else {
                console.error('Failed to add exam:', response.statusText);
                alert('Kļūda pievienojot eksāmenu. Lūdzu, mēģiniet vēlreiz.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
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
                                required
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
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDate">Eksāmena datums</label>
                        <input
                            type="date"
                            id="examDate"
                            className={`${style.inputCon}`}
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="class">Kurss</label>
                        <input
                            type="text"
                            id="class"
                            className={`${style.inputCon}`}
                            value={examClass}
                            onChange={(e) => setExamClass(e.target.value)}
                            required
                        />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examStart">Eksāmena sākums</label>
                        <input
                            type="time"
                            id="examStart"
                            className={`${style.inputCon}`}
                            value={examStart}
                            onChange={(e) => setExamStart(e.target.value)}
                            required
                        />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDuration">Skolēna atvēlētais laiks (min)</label>
                        <input
                            type="number"
                            id="examDuration"
                            className={`${style.inputCon}`}
                            value={examDuration}
                            onChange={(e) => setExamDuration(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <textarea
                    placeholder='Lūgums skolēnus atdalīt ar komatu'
                    className={`${style.textarea}`}
                    value={studentsText}
                    onChange={(e) => setStudentsText(e.target.value)}
                    required
                />
                <div className={`${style.submitContainer}`}>
                    <button type='submit' className={`${style.submit}`}>Pievienot</button>
                </div>
            </form>
        </div>
    )
}