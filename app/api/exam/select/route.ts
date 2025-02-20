// /api/exam/select/route.ts
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
    const { documentId, selectedClass } = requestBody; // **[MODIFIED] - Expect 'selectedClass' in request body**

    if (!documentId) {
        return NextResponse.json({ message: "Missing documentId" }, { status: 400 });
    }

    try {
        // --- Pusher Event Triggering (Exam Changed) ---
        pusherServer.trigger('exam-updates', 'exam-changed', { // Broadcast to 'exam-updates' channel
            documentId: documentId,     // Include documentId
            selectedClass: selectedClass, // **[MODIFIED] - Include selectedClass in event data**
        });
        // -----------------------------
        const mongoClientPromise = await getMongoClientPromise(); // Get MongoDB client
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const settingsCollection = db.collection("settings");

        await settingsCollection.updateOne( // Use updateOne with upsert to create if not exists
            { key: 'currentExamSelection' }, // Query to find the settings document
            { $set: { documentId: documentId, selectedClass: selectedClass } }, // Update operation: set documentId and selectedClass
            { upsert: true } // If no document with key 'currentExamSelection' exists, create a new one
        );

        return NextResponse.json(
            {
                message: "Exam and class selection broadcast via Pusher.", // **[MODIFIED] - Message updated**
                selectedDocumentId: documentId,
                broadcastedClass: selectedClass, // **[MODIFIED] - Include broadcastedClass in response**
            },
            { status: 200 }
        );

    } catch (error: unknown) {
        let errorMessage = "Failed to broadcast exam and class selection via Pusher."; // **[MODIFIED] - Error message updated**
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