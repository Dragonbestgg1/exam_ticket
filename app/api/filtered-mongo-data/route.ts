import { NextResponse, NextRequest } from 'next/server';
import { MongoClient, Db, Collection } from 'mongodb';
import getMongoClientPromise from '@/app/lib/mongodb';
import { StructuredData, ExamDocument } from '@/types/types';

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
              ...doc.classes[className],
              students: doc.classes[className].students || [],
              examName: doc.examName,
              className: className,
              _id: doc._id.toString(),
            };
          }
        }
      }
    });

    return NextResponse.json(structuredData);

  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Failed to fetch filtered data" }, { status: 500 });
  }
}