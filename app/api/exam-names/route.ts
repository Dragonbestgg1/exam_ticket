import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET() {
    try {
        const client = await getMongoClientPromise();
        if (!process.env.MONGODB_DB) {
            throw new Error("MONGODB_DB environment variable is not defined.");
        }
        const db = client.db(process.env.MONGODB_DB);
        const examsCollection = db.collection('exams');

        const examsData = await examsCollection.find({}, { projection: { _id: 1, examName: 1, examDate: 1, examStartTime: 1, examDuration: 1 } }).toArray();

        const transformedExamsData = examsData.map(exam => ({
            ...exam,
            _id: exam._id.toString(),
        }));

        return NextResponse.json(transformedExamsData, { status: 200 });

    } catch (error: unknown) {
        console.error('Error fetching exam names:', error);
        let errorMessage = 'Failed to fetch exam names';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}