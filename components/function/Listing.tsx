"use client"

import style from '@/styles/functions/listing.module.css';
import { useState, useEffect, useMemo } from 'react';
import { ListingProps, StudentRecord, ClassRecord } from '@/types/types';
import { useSession } from 'next-auth/react';

export default function Listing({
    filterText,
    initialRecordsData,
    examOptions,
    classOptions,
    selectedExam,
    selectedClass,
    onExamChange,
    onClassChange
}: ListingProps) {

    const initialRecords: ClassRecord[] = useMemo(() => {
        const classRecords: ClassRecord[] = [];
        if (initialRecordsData) {
            for (const className in initialRecordsData) {
                if (Object.prototype.hasOwnProperty.call(initialRecordsData, className)) {
                    const classData = initialRecordsData[className];
                    if (classData && classData.students && Array.isArray(classData.students)) {
                        classRecords.push({
                            classes: className,
                            students: classData.students.map((student) => ({
                                ...student,
                                _id: student._id || `student-no-id-${Math.random()}`
                            })),
                            examName: classData.examName,
                            _id: classData._id || `class-no-id-${className}-${classData.examName}-${Math.random()}`,
                            examstart: typeof classData.examstart === 'string' ? classData.examstart : undefined,
                            duration: typeof classData.duration === 'string' ? classData.duration : undefined,
                        });
                    }
                }
            }
        }
        return classRecords;
    }, [initialRecordsData]);

    const [records, setRecords] = useState<ClassRecord[]>(initialRecords);
    const constantTimeLabel = "Sākas:";
    const constantDateLabel = "Datums:";
    const constantDurationLabel = "Ilgums:";
    const { data: session } = useSession();

    useEffect(() => {
        let filteredRecords = initialRecords;

        if (selectedExam) {
            filteredRecords = filteredRecords.filter(record => record.examName === selectedExam);
        }

        if (selectedClass) {
            filteredRecords = filteredRecords.filter(record => record.classes === selectedClass);
        }

        if (filterText) {
            filteredRecords = filteredRecords.map(classRecord => {
                const filteredStudents = classRecord.students.filter(student =>
                    student.name.toLowerCase().includes(filterText.toLowerCase())
                );
                return filteredStudents.length > 0 ? { ...classRecord, students: filteredStudents } : null;
            }).filter(record => record !== null) as ClassRecord[];
        }

        setRecords(filteredRecords);
    }, [filterText, initialRecords, selectedExam, selectedClass]);

    const isAuthenticated = !!session?.user;

    return (
        <div className={`${style.main}`}>
            <div className={`${style.dropdowns}`}>
                <div>
                    <select
                        id="examDropdown"
                        value={selectedExam}
                        onChange={(e) => onExamChange(e.target.value)}
                        className={`${style.dropdown}`}
                    >
                        <option value="">Visi eksāmeni</option>
                        {examOptions.map((exam, index) => (
                            <option key={index} value={exam}>{exam}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <select
                        id="classDropdown"
                        value={selectedClass}
                        onChange={(e) => onClassChange(e.target.value)}
                        className={`${style.dropdown}`}
                    >
                        <option value="">Visi kursi</option>
                        {classOptions.map((className, index) => (
                            <option key={index} value={className}>{className}</option>
                        ))}
                    </select>
                </div>
            </div>

            {records.map((classRecord) => (
                <div key={`${classRecord.classes}-${classRecord._id}`} className={`${style.outerList}`} >
                    <h2 className={`${style.title}`}>{classRecord.examName} ({classRecord.classes})</h2>
                    <ul className={`${style.ul}`}>
                        {classRecord.students.map((student: StudentRecord) => (
                            <li key={student._id} className={`${style.list}`}>
                                <div className={`${style.align}`}>
                                    <div className={`${style.name}`}>
                                        <h1>{student.name}</h1>
                                    </div>
                                    <div className={`${style.time}`}>
                                        <h1>{constantTimeLabel}</h1>
                                        <h1>{student.examStartTime}</h1>
                                    </div>
                                    {!isAuthenticated && (
                                        <>
                                            <div className={`${style.time}`}>
                                                <h1>{constantDateLabel}</h1>
                                                <h1>{student.examDate}</h1>
                                            </div>
                                            <div className={`${style.time}`}>
                                                <h1>{constantDurationLabel}</h1>
                                                <h1>{student.examDuration} min</h1>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}