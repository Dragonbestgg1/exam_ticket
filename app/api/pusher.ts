import Pusher from 'pusher';
import PusherClient from 'pusher-js'; // Import client-side library

// Server-side Pusher instance (simplified options)
export const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    // Let's REMOVE 'useTLS' for now in server-side options - it's often default true
    // useTLS: true
});

// Client-side Pusher instance (pusherClient) - ensure correct client-side init
export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    {
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
    }
);