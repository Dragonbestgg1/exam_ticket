import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';
import { UserState } from '@/types/types';

export async function POST(request: Request) {
    try {
        const { lastSelectedStudentId, documentId, className } = await request.json();

        if (!lastSelectedStudentId) {
            return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
        }

        const client = await getMongoClientPromise();
        const db = client.db();

        await db.collection<UserState>('user_state').updateOne(
            { _id: 'global_state' },
            { $set: { lastSelectedStudentId, documentId, className } },
            { upsert: true }
        );

        return NextResponse.json({ message: 'User state saved successfully' });
    } catch (error) {
        console.error('Error saving user state:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
