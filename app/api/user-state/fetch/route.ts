// app/api/user-state/fetch/route.ts
import { NextResponse } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';
import { UserState } from '@/types/types';

export async function GET() {
    try {
        const client = await getMongoClientPromise();
        const db = client.db();

        const userState = await db.collection<UserState>('user_state').findOne({ _id: 'global_state' });

        return NextResponse.json(userState || {});
    } catch (error) {
        console.error('Error fetching user state:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
