import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";
import { pusherServer } from '@/app/api/pusher';
import { ObjectId } from 'mongodb';

interface Student {
    _id: string;
    examStartTime: string;
    examDuration: number;
    examEndTime: string;
}

const parseTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    if (typeof timeString !== "string") return 0;
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    const requestBody = await req.json();
    const {
        brakeMinutes,
        startTime,
        endTime,
        isBreakActive,
        examName,
        className,
        documentId,
        studentUUID // Expecting studentUUID now!
    } = requestBody;

    if (!examName || !className || !documentId) {
        return NextResponse.json(
            { message: "Missing required data (examName, className, documentId)." },
            { status: 400 }
        );
    }

    if (!brakeMinutes || !startTime || !endTime) {
        return NextResponse.json(
            {
                message:
                    "Missing required data (brakeMinutes, startTime, endTime) for new brake ...",
            },
            { status: 400 }
        );
    }


    try {
        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const brakesCollection = db.collection("brake");
        const examsCollection = db.collection("exams");

        const brakeData = {
            brakeMinutes,
            startTime,
            endTime,
            isBreakActive: true, // Always set to true when brake is submitted
            examName,
            className,
            documentId: documentId, // Store documentId for reference
            studentUUID: studentUUID, // Store studentUUID
            timestamp: new Date(),
        };

        const brakeResult = await brakesCollection.insertOne(brakeData);

        if (!brakeResult.acknowledged) {
            return NextResponse.json({ message: 'Failed to save brake time to database.' }, { status: 500 });
        }


        // --- Pusher Event Triggering (No changes needed here) ---
        pusherServer.trigger('exam-break-updates', 'break-status-changed', {
            documentId: documentId,
            isBreakActive: true,
        });
        // -----------------------------


        const exam = await examsCollection.findOne({ _id: new ObjectId(documentId) }); // Find Exam by ExamDocument ObjectId

        if (
            !exam ||
            !exam.classes ||
            !exam.classes[className] ||
            !exam.classes[className].students ||
            !Array.isArray(exam.classes[className].students)
        ) {
            return NextResponse.json(
                { message: "Exam not found or students data is missing." },
                { status: 404 }
            );
        }

        const brakeStartTimeMinutes = parseTimeToMinutes(startTime);
        const brakeDurationMinutes = parseInt(brakeMinutes, 10);

        let closestStudentIndex = -1;
        let minTimeDiff = Infinity;

        exam.classes[className].students.forEach(
            (student: Student, index: number) => {
                const studentStartTimeMinutes = parseTimeToMinutes(student.examStartTime);
                const timeDiff = studentStartTimeMinutes - brakeStartTimeMinutes;
                if (timeDiff >= 0 && timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestStudentIndex = index;
                }
            }
        );

        if (closestStudentIndex !== -1 && isBreakActive === true) {
            let accumulatedBreakMinutes = 0;
            for (
                let i = closestStudentIndex;
                i < exam.classes[className].students.length;
                i++
            ) {
                const student: Student = exam.classes[className].students[i];
                if (!student) continue;

                const currentStartTimeMinutes = parseTimeToMinutes(
                    student.examStartTime
                );
                const currentDurationMinutes = student.examDuration;

                const newStartTimeMinutes =
                    currentStartTimeMinutes +
                    brakeDurationMinutes +
                    accumulatedBreakMinutes;
                const newEndTimeMinutes = newStartTimeMinutes + currentDurationMinutes;

                const newStartTime = formatMinutesToTime(newStartTimeMinutes);
                const newEndTime = formatMinutesToTime(newEndTimeMinutes);

                exam.classes[className].students[i].examStartTime = newStartTime;
                exam.classes[className].students[i].examEndTime = newEndTime;


                await examsCollection.updateOne(
                    {
                        examName: examName,
                        className: className,
                        'classes.students._id': studentUUID, // Corrected query using studentUUID from requestBody
                    },
                    {
                        $set: {
                            'classes.$[].students.$[studentEl].examStartTime': newStartTime,
                            'classes.$[].students.$[studentEl].examEndTime': newEndTime,
                        },
                    },
                    {
                        arrayFilters: [
                            { 'studentEl._id': studentUUID } // Array filter using studentUUID from requestBody
                        ]
                    }
                );
            }
        }

        return NextResponse.json(
            {
                message:
                    "Brake record updated, student break status updated, student times updated (if brake started), and Pusher event triggered!",
                brakeId: brakeResult.insertedId
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        let errorMessage = "Failed to submit/update brake time, student break status, and trigger Pusher event.";
        if (error instanceof Error) {
            errorMessage += ` Error: ${error.message}`;
        } else {
            errorMessage += ` Unknown error: ${String(error)}`;
        }
        console.error(errorMessage);
        return NextResponse.json(
            {
                message: errorMessage,
            },
            { status: 500 }
        );
    }
}