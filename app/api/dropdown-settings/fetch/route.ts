import { NextResponse, NextRequest } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb'; // Adjust path if necessary


export async function GET(req: NextRequest) { // Use GET for GET requests
    try {
        const mongoClientPromise = await getMongoClientPromise();
        const db = mongoClientPromise.db(); // Get the database from the client
        const collection = db.collection('dropdownSettings'); // Use the same collection name

        const settings = await collection.findOne({}); // Fetch app-level settings

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