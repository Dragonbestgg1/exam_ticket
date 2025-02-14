import { NextResponse, NextRequest } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb'; // Adjust path if necessary

export async function GET(req: NextRequest) {
    try {
        const client = await getMongoClientPromise();
        if (!process.env.MONGODB_DB) {
            throw new Error("MONGODB_DB environment variable is not defined.");
        }
        const db = client.db(process.env.MONGODB_DB);
        const examsCollection = db.collection('exams');

        // Fetch exam names and other relevant data (excluding classes and students for now)
        const examsData = await examsCollection.find({}, { projection: { _id: 1, examName: 1, examDate: 1, examStartTime: 1, examDuration: 1 } }).toArray();

        // Transform _id to string for serialization
        const transformedExamsData = examsData.map(exam => ({
            ...exam,
            _id: exam._id.toString(), // Convert ObjectId to string
        }));

        return NextResponse.json(transformedExamsData, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching exam names:', error);
        let errorMessage = 'Failed to fetch exam names';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}