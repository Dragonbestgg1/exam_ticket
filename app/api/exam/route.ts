import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET() {
    try {
        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db(process.env.MONGODB_DB);
        const collection = db.collection('exams');

        const distinctExamNames = await collection.distinct("examName");

        return NextResponse.json({ examNames: distinctExamNames });

    } catch (error) {
        console.error("Error fetching exam names:", error);
        return NextResponse.json({ error: "Failed to fetch exam names" }, { status: 500 });
    }
}