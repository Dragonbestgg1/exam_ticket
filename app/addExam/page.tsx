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
                        <label htmlFor="examName">Eksāmena nosaukums</label>
                        <input type="text" id="examName" className={`${style.inputCon}`} />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDate">Eksāmena datums</label>
                        <input type="date" id="examDate" className={`${style.inputCon}`} />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="class">Kurss</label>
                        <input type="text" id="class" className={`${style.inputCon}`} />
                    </div>
                    <div className={`${style.input}`}>
                        <label htmlFor="examDuration">Skolēna atvēlētais laiks</label>
                        <input type="number" id="examDuration" className={`${style.inputCon}`} />
                    </div>
                </div>
                <textarea placeholder='Lūgums skolēnus atdalīt ar komatu' className={`${style.textarea}`} />
                <div className={`${style.submitContainer}`}>
                    <button type='submit' className={`${style.submit}`}>Pievienot</button>
                </div>
            </form>
        </div>
    )
}