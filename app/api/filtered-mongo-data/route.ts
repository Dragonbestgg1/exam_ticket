import { NextResponse, NextRequest } from 'next/server';
import { MongoClient, Db, Collection } from 'mongodb'; // Import necessary types
import getMongoClientPromise from '@/app/lib/mongodb';

interface ExamDocument {
  _id: any; // Keep _id as any if its type is not consistent
  examName: string;
  classes: { [className: string]: any }; // Define the structure of classes
}

interface StructuredData {
  [className: string]: {
    [key: string]: any; // Define the structure of class data
    examName: string;
    classes: string;
    _id: any;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examFilter = searchParams.get('exam') || '';
    const classFilter = searchParams.get('class') || '';

    const mongoClientPromise: Promise<MongoClient> = getMongoClientPromise();
    const mongoClient = await mongoClientPromise; // Await the promise
    const db: Db = mongoClient.db(process.env.MONGODB_DB || ''); // Provide a default value
    const collection: Collection<ExamDocument> = db.collection<ExamDocument>('exams');

    let query: any = {};
    if (examFilter) {
      query.examName = examFilter;
    }
    if (classFilter) {
      query[`classes.${classFilter}`] = { $exists: true };
    }

    const filteredData: ExamDocument[] = await collection.find(query).toArray();

    const structuredData: StructuredData = {};

    filteredData.forEach(doc => {
      if (doc.classes && typeof doc.classes === 'object') {
        for (const className in doc.classes) {
          if (doc.classes.hasOwnProperty(className)) {
            structuredData[className] = {
              ...doc.classes[className],
              examName: doc.examName,
              classes: className,
              _id: doc._id,
            };
          }
        }
      }
    });

    return NextResponse.json(structuredData);

  } catch (e) {
    console.error("Error fetching data:", e); // Log the error for debugging
    return NextResponse.json({ error: "Failed to fetch filtered data" }, { status: 500 });
  }
}