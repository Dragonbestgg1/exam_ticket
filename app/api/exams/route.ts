import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";
import { v4 as uuidv4 } from "uuid";

interface StudentData {
  _id: string;
  name: string;
  examDate: string;
  examStartTime: string;
  examDuration: number;
  examEndTime: string;
}

function calculateExamEndTime(startTime: string, duration: number): string {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const totalMinutes = startHour * 60 + startMinute + duration;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  const endTime = `${String(endHour).padStart(2, "0")}:${String(
    endMinute
  ).padStart(2, "0")}`;
  return endTime;
}

export async function POST(req: NextRequest) {
  try {
    const client = await getMongoClientPromise();
    if (!process.env.MONGODB_DB) {
      throw new Error("MONGODB_DB environment variable is not defined.");
    }
    const db = client.db(process.env.MONGODB_DB);
    const examsCollection = db.collection("exams");

    const examDataFromRequest = await req.json();

    const {
      examName,
      examClass,
      studentsText,
      examDate,
      examStartTime,
      examDuration,
    } = examDataFromRequest;

    if (
      !examName ||
      !examClass ||
      !studentsText ||
      !examDate ||
      !examStartTime ||
      !examDuration
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const parsedDuration = Number(examDuration);

    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return NextResponse.json(
        { message: "Invalid exam duration" },
        { status: 400 }
      );
    }

    let currentStartTime = examStartTime;
    const studentsData = studentsText
      .split(",")
      .map((student: string): StudentData => {
        const studentData: StudentData = {
          _id: uuidv4(),
          name: student.trim(),
          examDate: examDate,
          examStartTime: currentStartTime,
          examDuration: parsedDuration,
          examEndTime: "",
        };
        const examEndTime = calculateExamEndTime(
          currentStartTime,
          parsedDuration
        );
        studentData.examEndTime = examEndTime;
        currentStartTime = examEndTime;
        return studentData;
      });

    const classData = {
      students: studentsData,
    };

    const examDocument = {
      examName: examName,
      examstart: examStartTime,
      duration: parsedDuration,
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
        {
          $set: {
            classes: updatedClasses,
            examstart: examStartTime,
            duration: examDuration,
          },
        }
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
  } catch (error: unknown) {
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
