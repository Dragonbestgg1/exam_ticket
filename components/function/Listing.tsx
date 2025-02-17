"use client"

import style from '@/styles/functions/listing.module.css';
import { useState, useEffect, useMemo } from 'react';

interface ListingProps {
    filterText: string;
    initialRecordsData: any;
    examOptions: string[];
    classOptions: string[];
    selectedExam: string;
    selectedClass: string;
    onExamChange: (exam: string) => void;
    onClassChange: (className: string) => void;
}

interface StudentRecord {
    _id: string;
    name: string;
    examDate: string;
    examStartTime: string;
    examDuration: string;
    examEndTime: string;
}

interface ClassRecord {
    classes: string;
    students: StudentRecord[];
    examName: string;
    _id: string;
}

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
                if (initialRecordsData.hasOwnProperty(className)) {
                    const classData = initialRecordsData[className];
                    if (classData && classData.students && Array.isArray(classData.students)) {
                        classRecords.push({
                            classes: className,
                            students: classData.students.map((student: StudentRecord) => {
                                return {
                                    ...student,
                                    _id: student._id || `student-no-id-${Math.random()}`
                                };
                            }),
                            examName: classData.examName,
                            _id: classData._id || `class-no-id-${className}-${classData.examName}-${Math.random()}`,
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

    useEffect(() => {
        let filteredRecords = initialRecords;

        if (selectedExam) {
            filteredRecords = filteredRecords.filter(record => record.examName === selectedExam);
        }
        if (selectedClass) {
            filteredRecords = filteredRecords.filter(record => record.classes === selectedClass);
        }

        if (filterText) {  // Student name filter
            filteredRecords = filteredRecords.map(classRecord => {
                const filteredStudents = classRecord.students.filter(student => {
                    const studentName = student.name.toLowerCase(); // Filter by name only
                    return studentName.includes(filterText.toLowerCase());
                });
                if (filteredStudents.length > 0) {
                  return {
                    ...classRecord,
                    students: filteredStudents
                  }
                } else {
                  return null;
                }
            }).filter(record => record !== null);
        }

        setRecords(filteredRecords);
    }, [filterText, initialRecords, selectedExam, selectedClass]);

    return (
        <div className={`${style.main}`}>
            <div className={`${style.dropdowns}`}>
                <div>
                    <label htmlFor="examDropdown">Eksāmens:</label>
                    <select
                        id="examDropdown"
                        value={selectedExam}
                        onChange={(e) => onExamChange(e.target.value)}
                    >
                        <option value="">Visi eksāmeni</option>
                        {examOptions.map((exam, index) => (
                            <option key={index} value={exam}>{exam}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="classDropdown">Kurss:</label>
                    <select
                        id="classDropdown"
                        value={selectedClass}
                        onChange={(e) => onClassChange(e.target.value)}
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
                    <div>
                        <h2 className={`${style.title}`}>Eksāmens: {classRecord.examName} ({classRecord.classes})</h2>
                        <h2 className={`${style.title}`}>Datums: </h2>
                    </div>
                    <ul className={`${style.ul}`}>
                        {classRecord.students.map((student: StudentRecord) => (
                            <li key={student._id} className={`${style.list}`}>
                                <div className={`${style.align}`}>
                                    <div className={`${style.name}`}>
                                        <h1>{student.name}</h1>
                                    </div>
                                    <div className={`${style.time}`}>
                                        <h1>{constantDateLabel}</h1>
                                        <h1>{student.examDate}</h1>
                                    </div>
                                    <div className={`${style.time}`}>
                                        <h1>{constantTimeLabel}</h1>
                                        <h1>{student.examStartTime}</h1>
                                    </div>
                                    <div className={`${style.time}`}>
                                        <h1>{constantDurationLabel}</h1>
                                        <h1>{student.examDuration}</h1>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}