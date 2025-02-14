"use client"

import style from '@/styles/functions/listing.module.css'
import { useState, useEffect } from 'react'; // Import useState and useEffect

interface ListingProps {
    filterText: string; // Prop to receive filter text from parent
}

export default function Listing({ filterText }: ListingProps) { // Destructure filterText from props

    const initialRecords = [ // It's better to keep initial records separate for reset if needed
        {
            name1: "Edmunds",
            name2: "Berzons",
            timeValue: "12:00"
        },
        {
            name1: "John",
            name2: "Doe",
            timeValue: "14:30"
        },
        {
            name1: "Jane",
            name2: "Smith",
            timeValue: "16:00"
        },
        {
            name1: "Edmunds",
            name2: "Berzons",
            timeValue: "12:00"
        },
        {
            name1: "John",
            name2: "Doe",
            timeValue: "14:30"
        },
        {
            name1: "Jane",
            name2: "Smith",
            timeValue: "16:00"
        },
        {
            name1: "Edmunds",
            name2: "Berzons",
            timeValue: "12:00"
        },
        {
            name1: "John",
            name2: "Doe",
            timeValue: "14:30"
        },
        {
            name1: "Jane",
            name2: "Smith",
            timeValue: "16:00"
        },
    ];

    const [records, setRecords] = useState(initialRecords); // Use state to manage records, initially all records
    const constantTimeLabel = "Sākas:";

    useEffect(() => {
        // Filter records whenever filterText changes
        const filteredRecords = initialRecords.filter(record => {
            const searchText = filterText.toLowerCase();
            const name1 = record.name1.toLowerCase();
            const name2 = record.name2.toLowerCase();

            return name1.includes(searchText) || name2.includes(searchText);
        });
        setRecords(filteredRecords); // Update records state with filtered results
    }, [filterText]); // useEffect dependency on filterText

    return (
        <div className={`${style.main}`}>
            <ul className={`${style.ul}`}>
                {records.map((record, index) => (
                    <li key={index} className={`${style.list}`}>
                        <div className={`${style.align}`}>
                            <div className={`${style.name}`}>
                                <h1>
                                    {record.name1}
                                </h1>
                                <h1>
                                    {record.name2}
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