import { NextResponse } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";

export async function GET() {
  try {
    const client = await getMongoClientPromise();
    if (!process.env.MONGODB_DB) {
      throw new Error("MONGODB_DB environment variable is not defined.");
    }
    const db = client.db(process.env.MONGODB_DB);
    const examsCollection = db.collection("exams"); // Correct projection to fetch 'examstart' and 'duration' and map them to 'examStartTime' and 'examDuration'

    const examsData = await examsCollection
      .find(
        {},
        {
          projection: {
            _id: 1,
            examName: 1,
            examStartTime: "$examstart", // Map 'examstart' to 'examStartTime' in response
            examDuration: "$duration", // Map 'duration' to 'examDuration' in response
            // removed examDate from projection as it is not in top level exam document
          },
        }
      )
      .toArray();

    const transformedExamsData = examsData.map((exam) => ({
      ...exam,
      _id: exam._id.toString(),
    }));

    return NextResponse.json(transformedExamsData, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching exam names:", error);
    let errorMessage = "Failed to fetch exam names";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
