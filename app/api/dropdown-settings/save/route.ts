import { NextResponse, NextRequest } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { selectedExam, selectedClass } = data;

        if (!selectedExam || !selectedClass) {
            return NextResponse.json({ message: 'Missing selectedExam or selectedClass' }, { status: 400 });
        }

        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db();
        const collection = db.collection('dropdownSettings');

        await collection.updateOne(
            {},
            { $set: { selectedExam, selectedClass } },
            { upsert: true }
        );

        return NextResponse.json({ message: 'Dropdown settings saved successfully' }, { status: 200 });

    } catch (error) {
        console.error("Error saving dropdown settings:", error);
        return NextResponse.json({ message: 'Error saving dropdown settings', error: error }, { status: 500 });
    }
}