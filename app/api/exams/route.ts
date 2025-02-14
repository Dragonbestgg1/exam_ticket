import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";
import { v4 as uuidv4 } from 'uuid'; // Import UUID v4 generator

// Define the StudentData interface
interface StudentData {
    _id: string; // Add _id to StudentData interface
    name: string;
    examDate: any; // Consider using a more specific type for date, e.g., string or Date
    examStartTime: any; // Consider using a more specific type for time, e.g., string
    examDuration: any; // Consider using a more specific type, e.g., string or number
    examEndTime: string;
}

// Function to calculate exam end time
function calculateExamEndTime(startTime: string, duration: string): string {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const durationMinutes = parseInt(duration, 10);
    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(
        endMinute
    ).padStart(2, "0")}`;
    return endTime;
}


export async function POST(req: NextRequest) {
    try {
        const client = await getMongoClientPromise();
        if (!process.env.MONGODB_DB) {
            throw new Error("MONGODB_DB environment variable is not defined.");
        }
        const db = client.db(process.env.MONGODB_DB);
        const examsCollection = db.collection("exams");

        const examDataFromRequest = await req.json();
        const examName = examDataFromRequest.examName;
        const examClass = examDataFromRequest.examClass;
        const studentsText = examDataFromRequest.studentsText;
        const examDate = examDataFromRequest.examDate; // Moved to student level
        const examStartTime = examDataFromRequest.examStartTime; // Initial start time
        const examDuration = examDataFromRequest.examDuration; // Duration for all students

        let currentStartTime = examStartTime; // Track start time for sequential scheduling
        const studentsData = studentsText
            .split(",")
            .map((student: string): StudentData => { // Use StudentData interface here
                const studentData: StudentData = { // Explicitly type studentData
                    _id: uuidv4(), // Generate UUID for each student HERE!
                    name: student.trim(),
                    examDate: examDate, // Add examDate to student
                    examStartTime: currentStartTime, // Add examStartTime to student
                    examDuration: examDuration, // Add examDuration to student
                    examEndTime: "", // Initialize examEndTime to empty string, it will be calculated next
                };
                const examEndTime = calculateExamEndTime(currentStartTime, examDuration);
                studentData.examEndTime = examEndTime; // Calculate and add examEndTime
                currentStartTime = examEndTime; // Update start time for next student
                return studentData;
            });

        const classData = {
            students: studentsData,
        };

        const examDocument = {
            examName: examName,
        };

        const existingExam = await examsCollection.findOne({ examName: examName });

        if (existingExam) {
            const existingClasses = existingExam.classes || {};
            const updatedClasses = { ...existingClasses };

            if (updatedClasses[examClass]) {
                updatedClasses[examClass].students = [
                    ...(updatedClasses[examClass].students || []),
                    ...studentsData,
                ];
            } else {
                updatedClasses[examClass] = classData;
            }

            const result = await examsCollection.updateOne(
                { _id: existingExam._id },
                { $set: { classes: updatedClasses } }
            );

            if (result.modifiedCount > 0) {
                return NextResponse.json(
                    {
                        message:
                            "Exam updated successfully! Class and students added to existing exam.",
                        examId: existingExam._id.toString(),
                    },
                    { status: 200 }
                );
            } else {
                return NextResponse.json(
                    {
                        message:
                            "Exam found, but failed to update. Possibly class already existed or no changes made.",
                        examId: existingExam._id.toString(),
                    },
                    { status: 200 }
                );
            }
        } else {
            const examDataToInsert = {
                ...examDocument,
                classes: { [examClass]: classData },
            };
            const result = await examsCollection.insertOne(examDataToInsert);
            return NextResponse.json(
                { message: "Exam added successfully!", insertedId: result.insertedId },
                { status: 200 }
            );
        }
    } catch (error: unknown) {
        console.error("Error adding/updating exam:", error);
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else {
            errorMessage = String(error);
        }
        return NextResponse.json(
            { message: "Failed to add/update exam", error: errorMessage },
            { status: 500 }
        );
    }
}