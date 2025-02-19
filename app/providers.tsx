"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState, createContext, useContext } from 'react';
import Pusher from 'pusher-js';

// Create a context to make Pusher instance available
export const PusherContext = createContext<Pusher | null>(null);

interface PusherProviderProps {
  children: React.ReactNode;
  appKey: string;
  cluster: string;
}

export const PusherProvider: React.FC<PusherProviderProps> = ({ children, appKey, cluster }) => {
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);

  useEffect(() => {
    const pusher = new Pusher(appKey, {
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

export const usePusher = () => useContext(PusherContext);


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