import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";
import { MongoClient, MongoError } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const clientPromise = getMongoClientPromise();
    const client = (await clientPromise) as MongoClient;
    const db = client.db(process.env.MONGODB_DB);
    const examsCollection = db.collection("exams");

    const { studentId, examStartTime, examEndTime, examName, className } =
      requestBody;

    if (
      !studentId ||
      !examStartTime ||
      !examEndTime ||
      !examName ||
      !className
    ) {
      return NextResponse.json(
        {
          message:
            "Student ID, examStartTime, examEndTime, examName, and className are required",
        },
        { status: 400 }
      );
    }

    const updateFields: {
      [key: string]: string | undefined;
    } = {};

    if (examStartTime !== undefined) {
      updateFields[
        `classes.${className}.students.$[studentElem].examStartTime`
      ] = examStartTime;
    }
    if (examEndTime !== undefined) {
      updateFields[`classes.${className}.students.$[studentElem].examEndTime`] =
        examEndTime;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        {
          message: "Either examStartTime or examEndTime is required for update",
        },
        { status: 400 }
      );
    }

    const updateQuery = {
      examName: examName,
      [`classes.${className}.students._id`]: studentId,
    };
    const updateOptions = { arrayFilters: [{ "studentElem._id": studentId }] };

    const result = await examsCollection.updateOne(
      updateQuery,
      { $set: updateFields },
      updateOptions
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Student or Exam not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Exam times updated successfully" },
      { status: 200 }
    );
  } catch (e: unknown) {
    if (e instanceof MongoError) {
      console.error("MongoDB error updating exam times:", e);
      return NextResponse.json(
        { message: "Database error updating exam times", error: e.message },
        { status: 500 }
      );
    } else if (e instanceof Error) {
        console.error("Error updating exam times:", e);
        return NextResponse.json({ message: "Server error updating exam times", error: e.message}, { status: 500 });
    } else {
        console.error("Unknown error updating exam times:", e);
        return NextResponse.json({ message: "An unexpected error occurred", status: 500 });
    }
  }
}