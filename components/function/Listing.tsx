"use client"

import style from '@/styles/functions/listing.module.css'

export default function Listing() {

  const records = [
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

  const constantTimeLabel = "Sākas:";

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