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
            query.examName = examFilter;
        }
        if (classFilter) {
            query[`classes.${classFilter}`] = { $exists: true };
        }

        const filteredData = await collection.find(query).toArray();

        const structuredData: any = {};
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
        return NextResponse.json({ error: "Failed to fetch filtered data" }, { status: 500 });
    }
}