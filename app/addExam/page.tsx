"use client"

import Header from '@/components/ui/Header'
import style from '@/styles/pages/addExam.module.css'

export default function AddExam() {
    return (
        <div className={`${style.main}`}>
            <Header />
            <form className={`${style.form}`}>
                <div className={`${style.mainInfo}`}>
                    <div className={`${style.input}`}>
                        <label htmlFor="examName">Exam Name</label>
                        <input type="text" id="examName" />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDate">Exam Date</label>
                        <input type="date" id="examDate" />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examTime">Exam Time</label>
                        <input type="time" id="examTime" />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDuration">Exam Duration</label>
                        <input type="number" id="examDuration" />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examType">Exam Type</label>
                        <select id="examType">
                            <option value="1">Online</option>
                            <option value="2">Offline</option>
                        </select>
                    </div>
                </div>
                <textarea placeholder='Lūgums skolēnus atdalīt ar komatu' className={`${style.textarea}`} />
            </form>
        </div>
    )
}