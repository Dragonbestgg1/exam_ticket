import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";

interface ExamTimeUpdate {
    studentId: string;
    examStartTime: Date;
    examEndTime: Date;
    examName: string;
    className: string;
}

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    try {
        const requestBody = await req.json();
        const updates: ExamTimeUpdate[] = requestBody.updates;

        if (!updates || updates.length === 0) {
            return NextResponse.json({ message: "Invalid or empty updates array in request body" }, { status: 400 });
        }

        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const studentsCollection = db.collection("exam");

        const bulkOperations = updates.map((update) => ({
            updateOne: {
                filter: {
                    [`classes.${update.className}.students._id`]: update.studentId,
                },
                update: {
                    $set: {
                        [`classes.${update.className}.students.$[student].examStartTime`]: update.examStartTime,
                        [`classes.${update.className}.students.$[student].examEndTime`]: update.examEndTime,
                        [`classes.${update.className}.students.$[student].examName`]: update.examName,
                        [`classes.${update.className}.students.$[student].className`]: update.className,
                    },
                },
                arrayFilters: [
                    { 'student._id': update.studentId }
                ],
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
