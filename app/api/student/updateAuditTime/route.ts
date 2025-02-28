import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";

export async function POST(req: NextRequest) {
    try {
        const client = await getMongoClientPromise();
        if (!process.env.MONGODB_DB) {
            throw new Error("MONGODB_DB environment variable is not defined.");
        }
        const db = client.db(process.env.MONGODB_DB);
        const examsCollection = db.collection("exams");

        const requestBody = await req.json();

        const { studentId, auditStartTime, auditEndTime, examName, className, auditElapsedTime, auditExtraTime } = requestBody;

        const updateFields: { [key: string]: string | undefined } = {};
        if (auditStartTime) {
            updateFields[`classes.${className}.students.$[studentElem].auditStartTime`] = auditStartTime;
        }
        if (auditEndTime) {
            updateFields[`classes.${className}.students.$[studentElem].auditEndTime`] = auditEndTime;
        }
        if (auditElapsedTime) {
            updateFields[`classes.${className}.students.$[studentElem].auditElapsedTime`] = auditElapsedTime;
        }
        if (auditExtraTime) {
            updateFields[`classes.${className}.students.$[studentElem].auditExtraTime`] = auditExtraTime;
        }

        const query = {
            examName: examName,
            [`classes.${className}.students._id`]: studentId,
        };

        const update = {
            $set: updateFields,
        };

        const options = {
            arrayFilters: [{ "studentElem._id": studentId }],
        };

        const result = await examsCollection.updateOne(query, update, options);

        if (result.modifiedCount > 0 || result.upsertedCount > 0) {
            return NextResponse.json({ message: `Audit time updated successfully` }, { status: 200 });
        } else if (result.matchedCount > 0) {
            return NextResponse.json({ message: `Audit time updated (no modifications, but document matched)` }, { status: 200 });
        } else {
            return NextResponse.json({ message: "No student found with provided ID or no changes applied." }, { status: 400 });
        }

    } catch (error: unknown) {
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else {
            errorMessage = String(error);
        }
        return NextResponse.json({ message: "Failed to update audit time", error: errorMessage }, { status: 500 });
    }
}