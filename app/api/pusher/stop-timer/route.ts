// /app/api/pusher/stop-timer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import getMongoClientPromise from '@/app/lib/mongodb';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    useTLS: true,
});

export async function POST(req: NextRequest) {
    try {
        const { documentId, studentUUID, stopTimestamp, examName, className } = await req.json();

        // Trigger Pusher event to stop the timer in all clients
        await pusher.trigger('timer-channel', 'timer-stopped', {
            stopSignal: true,
            documentId,
            studentUUID,
            stopTimestamp,
        });

        const validTimestamp = Number(stopTimestamp);
        if (isNaN(validTimestamp) || validTimestamp <= 0) {
            throw new Error('Invalid stop timestamp provided');
        }

        const formattedStopTime = new Date(validTimestamp).toISOString();

        const client = await getMongoClientPromise();
        const db = client.db(process.env.MONGODB_DB);
        const examsCollection = db.collection('exams');

        const updateFields = {
            [`classes.${className}.students.$[studentElem].auditEndTime`]: formattedStopTime,
        };

        const query = {
            _id: documentId,
            examName,
            [`classes.${className}.students._id`]: studentUUID,
        };

        const update = { $set: updateFields };

        const options = {
            arrayFilters: [{ "studentElem._id": studentUUID }],
        };

        const result = await examsCollection.updateOne(query, update, options);

        if (result.modifiedCount === 0) {
            console.error('Failed to update student audit end time in MongoDB');
            return NextResponse.json({ status: 'error', message: 'Failed to update student data' }, { status: 500 });
        }

        return NextResponse.json({ status: 'success' }, { status: 200 });

    } catch (error) {
        console.error('Error in stop-timer API route:', error);
        return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
    }
}
