// app/types/structured-data.ts
import { ObjectId } from 'mongodb';

export interface StudentRecord {
    _id: string;
    name: string;
    examDate: string;
    examStartTime: string;
    examDuration: string;
    examEndTime: string;
    [key: string]: unknown;
}

export interface ClassDetails {
    teacher?: string;
    room?: string;
    time?: string;
    students?: StudentRecord[];
    [key: string]: unknown;
}

export interface ExamDocument {
    _id: ObjectId;
    examName: string;
    examstart: string;
    duration: string;
    classes: { [className: string]: ClassDetails };
}

export interface StructuredData {
    [className: string]: ClassDetails & {
        examName: string;
        className: string;
        _id: string;
        students: StudentRecord[];
    };
}

export interface ListingProps {
    filterText: string;
    initialRecordsData: StructuredData | null;
    examOptions: string[];
    classOptions: string[];
    selectedExam: string;
    selectedClass: string;
    onExamChange: (exam: string) => void;
    onClassChange: (className: string) => void;
}

export interface ClassRecordData {
    students: StudentRecord[];
    examName: string;
    _id: string;
    examstart?: string;
    duration?: string;
}

export interface ClassRecord extends ClassRecordData {
    classes: string; 
}