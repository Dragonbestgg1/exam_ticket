"use client"

import style from '@/styles/functions/listing.module.css';
import { useState, useEffect, useMemo } from 'react';

interface ListingProps {
    filterText: string;
}

export default function Listing({ filterText }: ListingProps) {

    const initialRecords = useMemo(() => [
        {
            name: "Edmunds1 VeryLongName",
            surname: "Berzons VeryLongSurname",
            timeValue: "12:00"
        },
        {
            name: "John",
            surname: "Doe",
            timeValue: "14:30"
        },
        {
            name: "Jane",
            surname: "Smith",
            timeValue: "16:00"
        },
        {
            name: "Edmunds",
            surname: "Berzons",
            timeValue: "12:00"
        },
        {
            name: "John",
            surname: "Doe",
            timeValue: "14:30"
        },
        {
            name: "Jane",
            surname: "Smith",
            timeValue: "16:00"
        },
        {
            name: "Edmunds",
            surname: "Berzons",
            timeValue: "12:00"
        },
        {
            name: "John",
            surname: "Doe",
            timeValue: "14:30"
        },
        {
            name: "Jane",
            surname: "Smith",
            timeValue: "16:00"
        },
    ], []);


    const [records, setRecords] = useState(initialRecords);
    const constantTimeLabel = "Sākas:";

    useEffect(() => {
        const filteredRecords = initialRecords.filter(record => {
            const searchText = filterText.toLowerCase();
            const name = record.name.toLowerCase();
            const surname = record.surname.toLowerCase();

            return name.includes(searchText) || surname.includes(searchText);
        });
        setRecords(filteredRecords);
    }, [filterText, initialRecords]);

    return (
        <div className={`${style.main}`}>
            <ul className={`${style.ul}`}>
                {records.map((record, index) => (
                    <li key={index} className={`${style.list}`}>
                        <div className={`${style.align}`}>
                            <div className={`${style.name}`}>
                                <h1>
                                    {record.name}
                                </h1>
                                <h1>
                                    {record.surname}
                                </h1>
                            </div>
                            <div className={`${style.time}`}>
                                <h1>
                                    {constantTimeLabel}
                                </h1>
                                <h1>
                                    {record.timeValue}
                                </h1>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}