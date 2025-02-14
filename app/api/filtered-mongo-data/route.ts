import { NextResponse, NextRequest } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const examFilter = searchParams.get('exam') || '';
        const classFilter = searchParams.get('class') || '';

        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db(process.env.MONGODB_DB);
        const collection = db.collection('exams');

        let query: any = {};
        if (examFilter) {
            query.examName = examFilter; // Exam filter still works at top level
        }
        if (classFilter) {
            query[`classes.${classFilter}`] = { $exists: true }; // Filter by KEY in 'classes' object
        }

        const filteredData = await collection.find(query).toArray();

        // Structure the data to handle nested 'classes' object (same as mongo-data route)
        const structuredData: any = {};
        filteredData.forEach(doc => {
             if (doc.classes && typeof doc.classes === 'object') { // Check if 'classes' is an object
                for (const className in doc.classes) { // Iterate through keys in 'classes' object (class names)
                    if (doc.classes.hasOwnProperty(className)) {
                        structuredData[className] = { // Use class name as key in structuredData
                            ...doc.classes[className], // Spread the class data
                            examName: doc.examName, // Add examName to each class data
                            classes: className,      // Add the className as a direct field
                            _id: doc._id,            // Add the document _id
                        };
                    }
                }
            } else {
                console.warn("API - filtered-mongo-data: Document has unexpected 'classes' structure (not an object):", doc);
            }
        });


        return NextResponse.json(structuredData);

    } catch (e) {
        console.error("API - Error fetching filtered data:", e);
        return NextResponse.json({ error: "Failed to fetch filtered data" }, { status: 500 });
    }
}