import { NextResponse, NextRequest } from 'next/server';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import getMongoClientPromise from '@/app/lib/mongodb';

interface ClassDetails {
  teacher?: string;
  room?: string;
  time?: string;
  [key: string]: unknown; // Allow other properties, specify if you know more
}

interface ExamDocument {
  _id: ObjectId;
  examName: string;
  classes: { [className: string]: ClassDetails };
}

interface StructuredData {
  [className: string]: ClassDetails & {
    examName: string;
    className: string;
    _id: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examFilter = searchParams.get('exam') || '';
    const classFilter = searchParams.get('class') || '';

    const mongoClientPromise: Promise<MongoClient> = getMongoClientPromise();
    const mongoClient = await mongoClientPromise;
    const db: Db = mongoClient.db(process.env.MONGODB_DB || 'your_db_name'); // Replace with your DB name or handle undefined
    const collection: Collection<ExamDocument> = db.collection<ExamDocument>('exams');

    // Use Record<string, unknown> instead of Record<string, any> for dynamic queries
    const query: Record<string, unknown> = {};
    if (examFilter) {
      query.examName = examFilter;
    }
    if (classFilter) {
      query[`classes.${classFilter}`] = { $exists: true };
    }

    const filteredData: ExamDocument[] = await collection.find(query).toArray();

    const structuredData: StructuredData = {};

    filteredData.forEach(doc => {
      if (doc.classes) {
        for (const className in doc.classes) {
          if (doc.classes.hasOwnProperty(className)) {
            structuredData[className] = {
              ...doc.classes[className],
              examName: doc.examName,
              className: className,
              _id: doc._id.toString(),
            };
          }
        }
      }
    });

    return NextResponse.json(structuredData);

  } catch (e) {
    console.error("Error fetching data:", e);
    return NextResponse.json({ error: "Failed to fetch filtered data" }, { status: 500 });
  }
}