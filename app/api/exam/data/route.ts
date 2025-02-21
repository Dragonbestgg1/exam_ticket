import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    const searchParams = req.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
        return NextResponse.json({ message: "Missing documentId parameter" }, { status: 400 });
    }

    try {
        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const examsCollection = db.collection("exams");

        let examDocument;
        try {
            const objectIdDocumentId = new ObjectId(documentId);
            examDocument = await examsCollection.findOne({ _id: objectIdDocumentId });
        } catch (objectIdError) {
            console.error("Error creating ObjectId from documentId:", documentId, objectIdError);
            return NextResponse.json({ message: "Invalid documentId format." }, { status: 400 });
        }

        if (!examDocument) {
            return NextResponse.json({ message: "Exam document not found." }, { status: 404 });
        }

        return NextResponse.json({ exam: examDocument }, { status: 200 });

    } catch (error: unknown) {
        let errorMessage = "Failed to fetch exam data from database.";
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