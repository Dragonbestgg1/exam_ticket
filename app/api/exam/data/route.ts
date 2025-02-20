// /api/exam/data/route.ts
import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb"; // Adjust path if necessary
import { ObjectId } from 'mongodb'; // Import ObjectId

export async function GET(req: NextRequest) { // Use GET request as we are fetching data
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
        const db = client.db("ExamTicket"); // Replace "ExamTicket" with your actual database name
        const examsCollection = db.collection("exams"); // Replace "exams" with your actual exam collection name

        let examDocument;
        try {
            // Convert documentId string to ObjectId for MongoDB query
            const objectIdDocumentId = new ObjectId(documentId);
            examDocument = await examsCollection.findOne({ _id: objectIdDocumentId });
        } catch (objectIdError) {
            console.error("Error creating ObjectId from documentId:", documentId, objectIdError);
            return NextResponse.json({ message: "Invalid documentId format." }, { status: 400 }); // Or 404 if you prefer to hide invalid ID vs not found
        }


        if (!examDocument) {
            return NextResponse.json({ message: "Exam document not found." }, { status: 404 });
        }

        return NextResponse.json({ exam: examDocument }, { status: 200 }); // Return the exam document in the response

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