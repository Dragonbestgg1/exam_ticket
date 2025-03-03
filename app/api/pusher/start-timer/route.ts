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

export async function POST(req: NextRequest) {
    try {
        const { documentId, studentUUID, className } = await req.json();
        console.log("✅ Received start-timer request:", { documentId, studentUUID, className });

        if (!documentId || !studentUUID || !className) {
            console.error("❌ Missing required fields!");
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }

        const startTimestamp = Date.now();
        await pusher.trigger('timer-channel', 'timer-started', {
            startSignal: true,
            documentId,
            studentUUID,
            startTimestamp,
        });

        const client = await getMongoClientPromise();
        const db = client.db(process.env.MONGODB_DB);
        const examsCollection = db.collection('exams');

        const query = {
            _id: new ObjectId(documentId),
            [`classes.${className}.students._id`]: studentUUID,
        };

        console.log("✅ MongoDB Query:", JSON.stringify(query));

        const getCurrentTimeHHMM = (): string => {
            const now = new Date();
            return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        };
        
        const formattedStartTime = getCurrentTimeHHMM();
        

        const update = {
            $set: {
                [`classes.${className}.students.$[studentElem].auditStartTime`]: formattedStartTime,
            },
        };        
        
        const options = {
            arrayFilters: [{ "studentElem._id": studentUUID }],
        };

        const result = await examsCollection.updateOne(query, update, options);

        if (result.modifiedCount === 0) {
            console.error("❌ No document matched for start time update.");
            return NextResponse.json({ status: 'error', message: 'Failed to update student data' }, { status: 500 });
        }

        console.log("✅ Audit Start Time Updated in MongoDB");
        return NextResponse.json({ status: 'success' }, { status: 200 });

    } catch (error) {
        console.error('❌ Error in start-timer API route:', error);
        return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
    }
}
