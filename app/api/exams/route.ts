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

    const examDataFromRequest = await req.json();
    const examName = examDataFromRequest.examName;
    const examClass = examDataFromRequest.examClass;
    const studentsText = examDataFromRequest.studentsText;
    const studentsData = studentsText
      .split(",")
      .map((student: string) => ({ name: student.trim() }));

    const classData = {
      students: studentsData,
      examDate: examDataFromRequest.examDate,
      examStartTime: examDataFromRequest.examStartTime,
      examDuration: examDataFromRequest.examDuration,
    };

    const examDocument = {
      examName: examName,
    };

    const existingExam = await examsCollection.findOne({ examName: examName });

    if (existingExam) {
      const existingClasses = existingExam.classes || {};
      const updatedClasses = { ...existingClasses };

      if (updatedClasses[examClass]) {
        updatedClasses[examClass].students = [
          ...(updatedClasses[examClass].students || []),
          ...studentsData,
        ];
      } else {
        updatedClasses[examClass] = classData;
      }

      const result = await examsCollection.updateOne(
        { _id: existingExam._id },
        { $set: { classes: updatedClasses } }
      );

      if (result.modifiedCount > 0) {
        return NextResponse.json(
          {
            message:
              "Exam updated successfully! Class and students added to existing exam.",
            examId: existingExam._id.toString(),
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          {
            message:
              "Exam found, but failed to update. Possibly class already existed or no changes made.",
            examId: existingExam._id.toString(),
          },
          { status: 200 }
        );
      }
    } else {
      const examDataToInsert = {
        ...examDocument,
        classes: { [examClass]: classData },
      };
      const result = await examsCollection.insertOne(examDataToInsert);
      return NextResponse.json(
        { message: "Exam added successfully!", insertedId: result.insertedId },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error adding/updating exam:", error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    return NextResponse.json(
      { message: "Failed to add/update exam", error: errorMessage },
      { status: 500 }
    );
  }
}
