import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET() {
    try {
        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db(process.env.MONGODB_DB);
        const collection = db.collection('exams');

        const allClasses = await collection.find({}).toArray();
        const distinctClassNames = new Set<string>();

        allClasses.forEach(doc => {
            if (doc.classes && typeof doc.classes === 'object') {
                for (const className in doc.classes) {
                    if (doc.classes.hasOwnProperty(className)) {
                        distinctClassNames.add(className);
                    }
                }
            }
        });

        return NextResponse.json({ classNames: Array.from(distinctClassNames) });

    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch class names" }, { status: 500 });
    }
}