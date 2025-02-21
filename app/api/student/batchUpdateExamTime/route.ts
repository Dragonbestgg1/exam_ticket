// /api/student/batchUpdateExamTime/route.ts
import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    try {
        const requestBody = await req.json();
        const updates = requestBody.updates; // Expecting an array of student update objects

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json({ message: "Invalid or empty updates array in request body" }, { status: 400 });
        }

        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const studentsCollection = db.collection("students");

        const bulkOperations = updates.map((update: any) => ({
            updateOne: {
                filter: { _id: new ObjectId(update.studentId) }, // Filter by studentId
                update: {
                    $set: {
                        examStartTime: update.examStartTime,
                        examEndTime: update.examEndTime,
                        examName: update.examName,
                        className: update.className
                    },
                },
            },
        }));

        const bulkResult = await studentsCollection.bulkWrite(bulkOperations);

        return NextResponse.json({
            message: "Exam times updated for multiple students (batch).",
            updatedCount: bulkResult.modifiedCount,
        }, { status: 200 });

    } catch (error: unknown) {
        let errorMessage = "Failed to update exam times for multiple students (batch).";
        if (error instanceof Error) {
            errorMessage += ` Error: ${error.message}`;
        } else {
            errorMessage += ` Unknown error: ${String(error)}`;
        }
        console.error(errorMessage);
        return NextResponse.json({
            message: errorMessage,
        }, { status: 500 });
    }
}