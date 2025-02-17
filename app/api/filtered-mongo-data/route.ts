import { NextResponse, NextRequest } from 'next/server';
import { MongoClient, Db, Collection } from 'mongodb';
import getMongoClientPromise from '@/app/lib/mongodb';
import { StructuredData, ExamDocument } from '@/app/types';


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examFilter = searchParams.get('exam') || '';
    const classFilter = searchParams.get('class') || '';

    const mongoClientPromise: Promise<MongoClient> = getMongoClientPromise();
    const mongoClient = await mongoClientPromise;
    const db: Db = mongoClient.db(process.env.MONGODB_DB || 'your_db_name');
    const collection: Collection<ExamDocument> = db.collection<ExamDocument>('exams');

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
              ...doc.classes[className], // Spread all class details (including students now if present)
              students: doc.classes[className].students || [], // Ensure students array is included, default to empty array if missing (for safety)
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