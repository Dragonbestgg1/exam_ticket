// /app/api/pusher/stop-timer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    useTLS: true,
});

export async function POST(req: NextRequest) {
    try {
        const { documentId, studentUUID } = await req.json();

        await pusher.trigger('timer-channel', 'timer-stopped', {
            stopSignal: true,
            documentId,
            studentUUID,
        });

        return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (error) {
        console.error('Pusher trigger error:', error);
        return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
    }
}
