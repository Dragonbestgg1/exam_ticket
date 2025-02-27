import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI!;
const DATABASE_NAME = "ExamTicket";
const COLLECTION_NAME = "exams";

interface StudentData {
  _id: string;
}

export async function POST(request: Request) {
  try {
    const { documentId, className, studentUUID } = await request.json();

    const client = await MongoClient.connect(MONGO_URI);
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const examDocument = await collection.findOne({
      _id: new ObjectId(documentId),
    });

    if (!examDocument) {
      return NextResponse.json(
        { error: "Exam document not found" },
        { status: 404 }
      );
    }

    const classData = examDocument.classes?.[className];

    if (!classData || !classData.students) {
      return NextResponse.json(
        { error: "Class or students not found" },
        { status: 404 }
      );
    }

    const studentData = classData.students.find(
      (student): student is StudentData => student._id === studentUUID
    );

    if (!studentData) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ studentData });
  } catch (error) {
    console.error("Error fetching student data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
