"use client"

import style from '@/styles/ui/monitor.module.css'

export default function Monitor() {
    return (
        <div className={`${style.main}`}>
            <div className={`${style.monitor}`}>
                <div className={`${style.student}`}>
                    <h1 className={`${style.studentName}`}>Edmunds</h1>
                    <h1 className={`${style.studentName}`}>Berzons</h1>
                </div>
                <div className={`${style.timers}`}>
                    <div className={`${style.timer}`}>
                        <h1 className={`${style.timerTitle}`}>Sāktais laiks: </h1>
                        <h1 className={`${style.time}`}>12:39</h1>
                    </div>
                    <div className={`${style.timer}`}>
                        <h1 className={`${style.timerTitle}`}>Beigšanas laiks: </h1>
                        <h1 className={`${style.time}`}>13:19</h1>
                    </div>
                </div>
                <div className={`${style.runtimes}`}>
                    <div className={`${style.runtimer}`}>
                        <h1>Aizņemtais laiks: </h1>
                        <h1>00:17:39</h1>
                    </div>
                    <div  className={`${style.runtimer}`}>
                        <h1>Papildus laiks: </h1>
                        <h1>+ 00:00:39</h1>
                    </div>
                </div>
            </div>
        </div>
    )
}