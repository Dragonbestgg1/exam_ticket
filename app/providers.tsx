"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState, createContext, useContext } from "react";
import PusherClient from "pusher-js";

export const PusherContext = createContext<PusherClient | null>(null);

interface PusherProviderProps {
    children: React.ReactNode;
    appKey: string;
    cluster: string;
}

interface CustomWindow extends Window {
    ___NEXT_HMR?: boolean;
}

export const PusherProvider: React.FC<PusherProviderProps> = ({ children, appKey, cluster }) => {
    const [pusherClient, setPusherClient] = useState<PusherClient | null>(null);

    useEffect(() => {
        console.log("Initializing Pusher Client...");
        const pusher = new PusherClient(appKey, {
            cluster: cluster,
        });

        setPusherClient(pusher);

        return () => {
            console.log("Disconnecting Pusher Client...");
            pusher.disconnect();
        };
    }, [appKey, cluster]);

    useEffect(() => {
        if (typeof window !== "undefined" && (window as CustomWindow).___NEXT_HMR) {
            return () => {
                console.log("HMR: Cleaning up Pusher client...");
                pusherClient?.disconnect();
            };
        }
    }, [pusherClient]);

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
                appKey={process.env.NEXT_PUBLIC_PUSHER_APP_KEY || ""}
                cluster={process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || ""}
            >
                {children}
            </PusherProvider>
        </SessionProvider>
    );
}
