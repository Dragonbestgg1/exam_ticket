import { NextResponse, NextRequest } from "next/server";
import Pusher from "pusher";
import getMongoClientPromise from "@/app/lib/mongodb";

const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
});

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    const requestBody = await req.json();
    const { documentId, selectedClass } = requestBody;

    if (!documentId) {
        return NextResponse.json({ message: "Missing documentId" }, { status: 400 });
    }

    try {
        pusherServer.trigger('exam-updates', 'exam-changed', {
            documentId: documentId,
            selectedClass: selectedClass,
        });
        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const settingsCollection = db.collection("settings");

        await settingsCollection.updateOne(
            { key: 'currentExamSelection' },
            { $set: { documentId: documentId, selectedClass: selectedClass } },
            { upsert: true }
        );

        return NextResponse.json(
            {
                message: "Exam and class selection broadcast via Pusher.",
                selectedDocumentId: documentId,
                broadcastedClass: selectedClass,
            },
            { status: 200 }
        );

    } catch (error: unknown) {
        let errorMessage = "Failed to broadcast exam and class selection via Pusher.";
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