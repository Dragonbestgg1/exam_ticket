import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';


export async function GET() {
    try {
        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db();
        const collection = db.collection('dropdownSettings');

        const settings = await collection.findOne({});

        if (settings) {
            return NextResponse.json({ selectedExam: settings.selectedExam, selectedClass: settings.selectedClass }, { status: 200 });
        } else {
            return NextResponse.json({ selectedExam: '', selectedClass: '' }, { status: 200 });
        }

    } catch (error) {
        console.error("Error fetching dropdown settings:", error);
        return NextResponse.json({ message: 'Error fetching dropdown settings', error: error }, { status: 500 });
    }
}