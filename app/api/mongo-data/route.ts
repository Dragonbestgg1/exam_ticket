import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET() {
    try {
        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db(process.env.MONGODB_DB);
        const collection = db.collection('exams');

        const allData = await collection.find({}).toArray();

        const structuredData: any = {};
        allData.forEach(doc => {
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
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}