import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import getMongoClientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    useTLS: true,
});

interface Student {
    _id: string;
    auditStartTime?: string;
    auditEndTime?: string;
    auditElapsedTime?: string;
    examStartTime?: string;
    examEndTime?: string;
}

interface Class {
    students: Student[];
}

interface Exam {
    _id: ObjectId;
    classes: {
        [className: string]: Class;
    };
}

export async function POST(req: NextRequest) {
    try {
        const { documentId, studentUUID, className } = await req.json();
        console.log("✅ Received stop-timer request:", { documentId, studentUUID, className });

        if (!documentId || !studentUUID || !className) {
            console.error("❌ Missing required fields!");
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }

        const stopTimestamp = Date.now();
        await pusher.trigger('timer-channel', 'timer-stopped', {
            stopSignal: true,
            documentId,
            studentUUID,
            stopTimestamp,
        });

        const client = await getMongoClientPromise();
        const db = client.db(process.env.MONGODB_DB);
        const examsCollection = db.collection('exams');
        const query = {
            _id: new ObjectId(documentId),
            [`classes.${className}.students._id`]: studentUUID,
        };

        console.log("✅ MongoDB Query:", JSON.stringify(query));

        const exam = await examsCollection.findOne<Exam>(query);
        if (!exam) {
            console.error("❌ Student or exam not found in MongoDB");
            return NextResponse.json({ status: 'error', message: 'Student not found' }, { status: 404 });
        }

        const student = exam.classes[className].students.find((s: Student) => s._id === studentUUID);
        if (!student || !student.auditStartTime) {
            console.error("❌ Audit start time missing in MongoDB");
            return NextResponse.json({ status: 'error', message: 'Audit start time missing' }, { status: 400 });
        }

        const calculateElapsedTime = (startTime: string, stopTime: string): string => {
            const [startHours, startMinutes] = startTime.split(":").map(Number);
            const [stopHours, stopMinutes] = stopTime.split(":").map(Number);

            let elapsedMinutes = stopMinutes - startMinutes;
            let elapsedHours = stopHours - startHours;

            if (elapsedMinutes < 0) {
                elapsedHours--;
                elapsedMinutes += 60;
            }

            return `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}`;
        };

        const getCurrentTimeHHMM = (): string => {
            const now = new Date();
            return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        };

        const formattedStopTime = getCurrentTimeHHMM();
        const elapsedTimeFormatted = calculateElapsedTime(student.auditStartTime!, formattedStopTime);

        const update = {
            $set: {
                [`classes.${className}.students.$[studentElem].auditEndTime`]: formattedStopTime,
                [`classes.${className}.students.$[studentElem].auditElapsedTime`]: elapsedTimeFormatted,
                [`classes.${className}.students.$[studentElem].examStartTime`]: student.auditStartTime,
                [`classes.${className}.students.$[studentElem].examEndTime`]: formattedStopTime,
            },
        };

        const options = {
            arrayFilters: [{ "studentElem._id": studentUUID }],
        };

        const result = await examsCollection.updateOne(query, update, options);

        if (result.modifiedCount === 0) {
            console.error("❌ No document matched for stop time update.");
            return NextResponse.json({ status: 'error', message: 'Failed to update student data' }, { status: 500 });
        }

        console.log("✅ Audit Stop Time and Exam Times Updated in MongoDB");
        return NextResponse.json({ status: 'success' }, { status: 200 });

    } catch (error) {
        console.error('❌ Error in stop-timer API route:', error);
        return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
    }
}
