"use client"

import Header from '@/components/ui/Header'
import style from '@/styles/pages/addExam.module.css'

export default function AddExam() {
    return(
        <div className={`${style.main}`}>
            <Header />
            <h1>Add Exam</h1>
        </div>
    )
}