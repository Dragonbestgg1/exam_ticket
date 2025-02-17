import { NextResponse, NextRequest } from 'next/server';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import getMongoClientPromise from '@/app/lib/mongodb';

interface ExamDocument {
  _id: ObjectId;
  examName: string;
  classes: { [className: string]: { [key: string]: any } }; // Define structure more precisely
}

interface StructuredData {
  [className: string]: {
    [key: string]: any;
    examName: string;
    classes: string;
    _id: string; // Store _id as string for consistency
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

    const query: any = {}; // Initialize as any to handle dynamic queries
    if (examFilter) {
      query.examName = examFilter;
    }
    if (classFilter) {
      query[`classes.${classFilter}`] = { $exists: true };
    }

    const filteredData: ExamDocument[] = await collection.find(query).toArray();

    const structuredData: StructuredData = {};

    filteredData.forEach(doc => {
      if (doc.classes) { // No need to check for object type, it's already defined in the interface
        for (const className in doc.classes) {
          if (doc.classes.hasOwnProperty(className)) {
            structuredData[className] = {
              ...doc.classes[className],
              examName: doc.examName,
              classes: className,
              _id: doc._id.toString(), // Convert ObjectId to string
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