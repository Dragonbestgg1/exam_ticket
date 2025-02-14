import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET() {
    try {
        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db(process.env.MONGODB_DB);
        const collection = db.collection('exams'); // Assuming collection name is 'exams'

        const distinctExamNames = await collection.distinct("examName");

        return NextResponse.json({ examNames: distinctExamNames });

    } catch (e) {
        console.error("API - Error fetching exam names:", e);
        return NextResponse.json({ error: "Failed to fetch exam names" }, { status: 500 });
    }
}