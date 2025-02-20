// /api/exam/current-selection/route.ts
import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb"; // Adjust path if necessary

export async function GET(req: NextRequest) {
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    try {
        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket"); // Replace "ExamTicket" with your database name
        const settingsCollection = db.collection("settings"); // Assuming a 'settings' collection

        // Fetch the settings document (assuming you store current selection in a single doc)
        const settingsDocument = await settingsCollection.findOne({ key: 'currentExamSelection' }); // Assuming you use a key to identify the settings doc

        if (settingsDocument && settingsDocument.documentId && settingsDocument.selectedClass) {
            return NextResponse.json(
                {
                    documentId: settingsDocument.documentId,
                    selectedClass: settingsDocument.selectedClass,
                },
                { status: 200 }
            );
        } else {
            // No current selection found in settings
            return NextResponse.json(
                {
                    documentId: null,
                    selectedClass: null,
                    message: "No current exam and class selection found."
                },
                { status: 200 } // Still 200 OK, but indicating no selection
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