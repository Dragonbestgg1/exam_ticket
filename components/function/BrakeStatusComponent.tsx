'use client';

import React, { useEffect, useState } from 'react';
import { usePusher } from '@/app/providers';

interface BrakeStatusComponentProps {
    itemId: string;
    channelName: string;
    eventName: string;
    onBrakeStatusChange: (isBrakeActive: boolean) => void;
}

const BrakeStatusComponent: React.FC<BrakeStatusComponentProps> = ({ itemId, channelName, eventName, onBrakeStatusChange }) => {
    const [isBrakeActive, setIsBrakeActive] = useState(false);
    const pusherClient = usePusher();

    useEffect(() => {
        if (!pusherClient) {
            console.log("BrakeStatusComponent: pusherClient is null, exiting useEffect");
            return;
        }
        const channel = pusherClient.subscribe(channelName as string);
        channel.bind(eventName, async (data: any) => {

            try {
                const response = await fetch(`/api/getEndTime?itemId=${itemId}`);
                if (!response.ok) {
                    console.error('BrakeStatusComponent: Failed to fetch endTime:', response.status, response.statusText);
                    return;
                }
                const responseData = await response.json();
                const endTimeString = responseData.endTime;
                const startTimeString = responseData.startTime;

                if (!endTimeString || !startTimeString) {
                    console.warn('BrakeStatusComponent: startTime or endTime missing from API response');
                    return;
                }

                const currentTime = new Date();

                const timeStringToDate = (timeString: string) => {
                    const [hours, minutes] = timeString.split(':').map(Number);
                    const date = new Date();
                    date.setHours(hours);
                    date.setMinutes(minutes);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                    return date;
                };

                const endTime = timeStringToDate(endTimeString);
                const startTime = timeStringToDate(startTimeString);


                let newBrakeActiveState = false;
                if (currentTime < endTime && currentTime >= startTime) {
                    newBrakeActiveState = data.isBrakeActive;
                }

                setIsBrakeActive(newBrakeActiveState);
                onBrakeStatusChange(newBrakeActiveState);

            } catch (error) {
                console.error('BrakeStatusComponent: Error fetching endTime:', error);
            }
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe;
        };
    }, [pusherClient, itemId, channelName, eventName, onBrakeStatusChange]);


    return null;
};

export default BrakeStatusComponent;