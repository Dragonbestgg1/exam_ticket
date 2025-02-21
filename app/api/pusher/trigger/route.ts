import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
const secret = process.env.PUSHER_APP_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;

if (!appId || !key || !secret || !cluster) {
    throw new Error('Missing Pusher credentials in environment variables');
}

const pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
});

export async function POST(request: Request) {
    try {
        const { channel, event, data } = await request.json();
        console.log("Pusher Trigger Data:", { channel, event, data });

        await pusher.trigger(channel, event, data);

        return NextResponse.json({ message: 'Event triggered successfully' }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Pusher trigger error:', error.message);
        } else {
            console.error('Unknown error:', error);
        }

        return NextResponse.json({ error: 'Failed to trigger Pusher event' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
