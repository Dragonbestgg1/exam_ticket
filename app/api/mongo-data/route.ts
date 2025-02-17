import { NextResponse } from 'next/server';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb'; // Import ObjectId
import getMongoClientPromise from '@/app/lib/mongodb';

interface Student {
  _id: string;
  name: string;
  examDate: string;
  examStartTime: string;
  examDuration: string;
  examEndTime: string;
}

interface ClassData {
  students: Student[];
  // Add other properties of the class if there are any, e.g., teacher, subject
}

interface ExamDocument {
  _id: ObjectId; // Use ObjectId type
  examName: string;
  examstart: string;
  duration: string;
  classes: { [className: string]: ClassData };
}

interface StructuredData {
  [className: string]: {
    students: Student[];
    examName: string;
    classes: string;
    _id: ObjectId; // Use ObjectId type
    examstart: string;
    duration: string;

  };
}

export async function GET() {
  try {
    const mongoClientPromise: Promise<MongoClient> = getMongoClientPromise();
    const mongoClient = await mongoClientPromise;
    const db: Db = mongoClient.db(process.env.MONGODB_DB || '');
    const collection: Collection<ExamDocument> = db.collection<ExamDocument>('exams');

    const allData: ExamDocument[] = await collection.find({}).toArray();

    const structuredData: StructuredData = {};

    allData.forEach(doc => {
      if (doc.classes && typeof doc.classes === 'object') {
        for (const className in doc.classes) {
          if (doc.classes.hasOwnProperty(className)) {
            structuredData[className] = {
              ...doc.classes[className],
              examName: doc.examName,
              classes: className,
              _id: doc._id,
              examstart: doc.examstart,
              duration: doc.duration,
            };
          }
        }
      }
    });

    return NextResponse.json(structuredData);

  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}