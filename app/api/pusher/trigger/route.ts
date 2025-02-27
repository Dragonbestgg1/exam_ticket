// /app/api/pusher/trigger/route.ts
import { NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    useTLS: true,
});

export async function POST(request: Request) {
    try {
        const { channel, event, data } = await request.json();
        await pusher.trigger(channel, event, data);
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Pusher trigger error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
