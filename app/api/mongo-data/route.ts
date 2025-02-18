import { NextResponse } from 'next/server';
import { MongoClient, Db, Collection } from 'mongodb';
import getMongoClientPromise from '@/app/lib/mongodb';
import { StructuredData, ExamDocument, ClassDetails } from '@/types/types';

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
            const classData = doc.classes[className] as ClassDetails;

            const students = classData.students || [];

            structuredData[className] = {
              ...classData,
              students: students,
              examName: doc.examName,
              className: className,
              _id: doc._id.toString(),
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