import { NextResponse, NextRequest } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb'; // Import ObjectId

interface ExamDocument {
  _id: ObjectId;
  examName: string;
  classes?: { [className: string]: { students: any[] } }; // Define the structure of classes
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examFilter = searchParams.get('exam') || '';
    const classFilter = searchParams.get('class') || '';

    const mongoClientPromise = await getMongoClientPromise();
    const db = mongoClientPromise.db(process.env.MONGODB_DB);
    const collection = db.collection<ExamDocument>('exams'); // Type the collection

    const query: any = {}; // Type query appropriately if possible. If not, consider using a more general type like Record<string, any>.
    if (examFilter) {
      query.examName = examFilter;
    }
    if (classFilter) {
      query[`classes.${classFilter}`] = { $exists: true };
    }

    const filteredData = await collection.find(query).toArray();

    const structuredData: Record<string, any> = {}; // Use Record<string, any> for flexibility
    filteredData.forEach(doc => {
      if (doc.classes && typeof doc.classes === 'object') {
        for (const className in doc.classes) {
          if (Object.prototype.hasOwnProperty.call(doc.classes, className)) {
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

  } catch (error) { // Rename 'e' to 'error' and use it
      console.error("Error fetching filtered data:", error); // Log the error
    return NextResponse.json({ error: "Failed to fetch filtered data" }, { status: 500 });
  }
}