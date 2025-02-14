import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET() {
    try {
        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db(process.env.MONGODB_DB);
        const collection = db.collection('exams');

        const allData = await collection.find({}).toArray();

        // Structure the data to handle nested 'classes' object
        const structuredData: any = {};
        allData.forEach(doc => {
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
                console.warn("API - mongo-data: Document has unexpected 'classes' structure (not an object):", doc);
            }
        });

        return NextResponse.json(structuredData);

    } catch (e) {
        console.error("API - Error fetching data:", e);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}