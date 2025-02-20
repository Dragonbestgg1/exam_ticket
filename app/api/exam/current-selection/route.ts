// /api/exam/current-selection/route.ts
import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    try {
        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const settingsCollection = db.collection("settings");
        const examsCollection = db.collection("exams"); // <-- ADD examsCollection access

        const currentSelectionSetting = await settingsCollection.findOne({ key: 'currentExamSelection' });

        if (currentSelectionSetting && currentSelectionSetting.documentId) {
            let examDocument;
            try {
                const documentObjectId = new ObjectId(currentSelectionSetting.documentId);
                examDocument = await examsCollection.findOne({ _id: documentObjectId }); // Fetch exam document
            } catch (objectIdError) {
                console.error("Error creating ObjectId from documentId:", currentSelectionSetting.documentId, objectIdError);
                return NextResponse.json({ message: "Invalid documentId format in settings." }, { status: 400 });
            }

            if (examDocument) {
                return NextResponse.json({
                    documentId: currentSelectionSetting.documentId,
                    selectedClass: currentSelectionSetting.selectedClass,
                    examName: examDocument.examName, // <-- INCLUDE examName from examDocument
                    message: "Current exam and class selection retrieved."
                }, { status: 200 });
            } else {
                return NextResponse.json({
                    documentId: null,
                    selectedClass: null,
                    examName: null, // No examName as document not found
                    message: "Current exam document not found for persisted documentId."
                }, { status: 404 }); // Or adjust status code as needed
            }

        } else {
            return NextResponse.json({
                documentId: null,
                selectedClass: null,
                examName: null, // No examName as no selection
                message: "No current exam and class selection found."
            }, { status: 200 }); // Or 200 to indicate no selection, not an error
        }

    } catch (error: unknown) {
        let errorMessage = "Failed to fetch current exam selection.";
        if (error instanceof Error) {
            errorMessage += ` Error: ${error.message}`;
        } else {
            errorMessage += ` Unknown error: ${String(error)}`;
        }
        console.error(errorMessage);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}