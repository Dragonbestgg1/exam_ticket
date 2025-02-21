import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";

export async function GET(req: NextRequest) {
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    try {
        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const settingsCollection = db.collection("settings");

        const settingsDocument = await settingsCollection.findOne({ key: 'currentExamSelection' });

        if (settingsDocument && settingsDocument.documentId && settingsDocument.selectedClass) {
            return NextResponse.json(
                {
                    documentId: settingsDocument.documentId,
                    selectedClass: settingsDocument.selectedClass,
                },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                {
                    documentId: null,
                    selectedClass: null,
                    message: "No current exam and class selection found."
                },
                { status: 200 }
            );
        }

    } catch (error: unknown) {
        let errorMessage = "Failed to fetch current exam selection.";
        if (error instanceof Error) {
            errorMessage += ` Error: ${error.message}`;
        } else {
            errorMessage += ` Unknown error: ${String(error)}`;
        }
        console.error(errorMessage);
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}