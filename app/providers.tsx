// providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState, createContext, useContext } from 'react';
import PusherClient from 'pusher-js'; // Import PusherClient explicitly

// Create a context to make Pusher instance available
export const PusherContext = createContext<PusherClient | null>(null); // Use PusherClient type

interface PusherProviderProps {
    children: React.ReactNode;
    appKey: string;
    cluster: string;
}

export const PusherProvider: React.FC<PusherProviderProps> = ({ children, appKey, cluster }) => {
    const [pusherClient, setPusherClient] = useState<PusherClient | null>(null);

    useEffect(() => {
        const pusher = new PusherClient(appKey, {
            cluster: cluster,
        });

        setPusherClient(pusher);

        return () => {
            if (pusher) {
                pusher.disconnect();
            }
        };
    }, [appKey, cluster]);

    return (
        <PusherContext.Provider value={pusherClient}>
            {children}
        </PusherContext.Provider>
    );
};

export const usePusher = () => useContext(PusherContext) as PusherClient | null;


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <PusherProvider
                appKey={process.env.NEXT_PUBLIC_PUSHER_APP_KEY || ''}
                cluster={process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || ''}
            >
                {children}
            </PusherProvider>
        </SessionProvider>
    );
}
