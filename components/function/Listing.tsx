"use client"

import style from '@/styles/functions/listing.module.css';
import { useState, useEffect, useMemo } from 'react';

interface ListingProps {
    filterText: string;
    initialRecordsData: any;
}

interface StudentRecord {
    _id: string; // _id is now expected from the backend
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
    _id: string; // Class _id
}

export default function Listing({ filterText, initialRecordsData }: ListingProps) {

    const initialRecords: ClassRecord[] = useMemo(() => {
        const classRecords: ClassRecord[] = [];
        if (initialRecordsData && initialRecordsData.classes) {
            for (const className in initialRecordsData.classes) {
                if (initialRecordsData.classes.hasOwnProperty(className)) {
                    const classData = initialRecordsData.classes[className];
                    if (classData && classData.students && Array.isArray(classData.students)) {
                        classRecords.push({
                            classes: className,
                            students: classData.students, // Students should now have _id from backend
                            examName: classData.examName,
                            _id: classData._id,
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
        const filteredRecords = initialRecords.filter(classRecord => {
            let classString = JSON.stringify(classRecord).toLowerCase();
            return classString.includes(filterText.toLowerCase());
        });
        setRecords(filteredRecords);
    }, [filterText, initialRecords]);


    return (
        <div className={`${style.main}`}>
            {records.map((classRecord, classIndex) => (
                <div key={classRecord._id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
                    <h2 style={{ margin: '0 0 10px 0' }}>Exam: {classRecord.examName} ({classRecord.classes})</h2>
                    <ul className={`${style.ul}`}>
                        {classRecord.students.map((student: StudentRecord, studentIndex) => (
                            <li key={student._id} className={`${style.list}`}> {/* Use student._id as key */}
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

