// app/api/mongo-data/route.ts
import { NextResponse, NextRequest } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

export async function GET(req: NextRequest) {
    console.log("App Router GET handler called for /api/mongo-data!");
    let client;
    try {
        console.log("App Router - Attempting to get MongoDB client promise...");
        client = await getMongoClientPromise();
        console.log("App Router - Successfully obtained MongoDB client promise.");

        const db = client.db(process.env.MONGODB_DB); // **USE process.env.MONGODB_DB here!**
        const collection = db.collection('exams'); // **KEEP yourCollectionName (ensure it's correct)**

        console.log("App Router - Attempting to find one document in the collection...");
        const data = await collection.findOne({});
        console.log("App Router - Query executed. Data retrieved:", data);

        console.log("App Router - Sending JSON response with data:", data);
        return NextResponse.json(data, { status: 200 });

    } catch (error: unknown) {
        console.error("App Router - MongoDB connection or query error:", error);
        let errorMessage = 'Failed to fetch data from MongoDB';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: 'Failed to fetch data from MongoDB', details: errorMessage }, { status: 500 });

    } finally {
        // REMOVE the client.close() call from here
        // No need to close the client here anymore. Connection is managed by getMongoClientPromise
        console.log("App Router - Finally block executed, connection closure is now managed externally.");
    }
}