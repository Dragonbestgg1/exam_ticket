// app/api/brake/route.ts
import { NextResponse, NextRequest } from 'next/server';
import getMongoClientPromise from '@/app/lib/mongodb';

const parseTimeToMinutes = (timeString: string): number => {
    console.log("parseTimeToMinutes input:", timeString, typeof timeString);
    if (!timeString) return 0;
    if (typeof timeString !== 'string') {
        console.error("parseTimeToMinutes: Input is NOT a string!", timeString);
        return 0;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        const requestBody = await req.json();
        const { brakeMinutes, startTime, endTime, isBreakActive, examName, className } = requestBody;

        console.log("API - /api/brake - Received data:", { examName, className, startTime, brakeMinutes, endTime, isBreakActive });

        if (!examName || !className) { // startTime, endTime, brakeMinutes, isBreakActive are not strictly required for brake end update
            return NextResponse.json({ message: 'Missing required data (examName, className) ...' }, { status: 400 });
        }

        const mongoClientPromise = await getMongoClientPromise();
        const client = await mongoClientPromise;
        const db = client.db("ExamTicket");
        const brakesCollection = db.collection("brake");
        const examsCollection = db.collection("exams");

        const existingBrake = await brakesCollection.findOne({ examName: examName, className: className });

        if (existingBrake) {
            console.log("API - /api/brake - Existing brake record found, updating...");
            const updateResult = await brakesCollection.updateOne(
                { examName: examName, className: className },
                {
                    $set: {
                        startTime: startTime, // Will update even if startTime is missing (for brake end)
                        interval: brakeMinutes ? parseInt(brakeMinutes, 10) : existingBrake.interval, //Keep existing interval if not provided
                        endTime: endTime,     // Will update even if endTime is missing (for brake start)
                        isBreakActive: isBreakActive,
                        timestamp: new Date()
                    }
                }
            );
            console.log("API - /api/brake - Brake record updated:", updateResult);

        } else {
            console.log("API - /api/brake - No existing brake record, creating new...");
            if (!brakeMinutes || !startTime || !endTime ) { //These are required for new brake
                return NextResponse.json({ message: 'Missing required data (brakeMinutes, startTime, endTime) for new brake ...' }, { status: 400 });
            }
            const insertResult = await brakesCollection.insertOne({
                startTime,
                interval: parseInt(brakeMinutes, 10),
                endTime,
                isBreakActive,
                examName,
                className,
                timestamp: new Date()
            });
            console.log("API - /api/brake - New brake record inserted:", insertResult);
        }


        const exam = await examsCollection.findOne({ examName: examName });
        console.log("API - /api/brake - Exam found:", !!exam);

        if (!exam || !exam.classes || !exam.classes[className] || !exam.classes[className].students || !Array.isArray(exam.classes[className].students)) {
            return NextResponse.json({ message: 'Exam not found or students data is missing.' }, { status: 404 });
        }

        // --- Student time update logic (remains mostly the same) ---
        const brakeStartTimeMinutes = parseTimeToMinutes(startTime);
        const brakeDurationMinutes = parseInt(brakeMinutes, 10);

        let closestStudentIndex = -1;
        let minTimeDiff = Infinity;

        exam.classes[className].students.forEach((student: any, index: number) => {
            const studentStartTimeMinutes = parseTimeToMinutes(student.examStartTime);
            const timeDiff = studentStartTimeMinutes - brakeStartTimeMinutes;
            console.log(`API - /api/brake - Student: ${student.name}, index: ${index}, studentStartTimeMinutes: ${studentStartTimeMinutes}, timeDiff: ${timeDiff}`);
            if (timeDiff >= 0 && timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                closestStudentIndex = index;
            }
        });
        console.log("API - /api/brake - closestStudentIndex:", closestStudentIndex);

        if (closestStudentIndex !== -1 && isBreakActive === true) { // Only update student times if brake is starting (isBreakActive: true)
            let accumulatedBreakMinutes = 0;
            for (let i = closestStudentIndex; i < exam.classes[className].students.length; i++) {
                const student = exam.classes[className].students[i];
                if (!student) continue;

                console.log(`API - /api/brake - Processing student index ${i}, name: ${student.name}, _id: ${student._id}`);
                console.log(`API - /api/brake -  Original times - startTime: ${student.examStartTime}, endTime: ${student.examEndTime}`);

                const currentStartTimeMinutes = parseTimeToMinutes(student.examStartTime);
                const currentDurationMinutes = student.examDuration;

                const newStartTimeMinutes = currentStartTimeMinutes + brakeDurationMinutes + accumulatedBreakMinutes;
                const newEndTimeMinutes = newStartTimeMinutes + currentDurationMinutes;

                const newStartTime = formatMinutesToTime(newStartTimeMinutes);
                const newEndTime = formatMinutesToTime(newEndTimeMinutes);

                exam.classes[className].students[i].examStartTime = newStartTime;
                exam.classes[className].students[i].examEndTime = newEndTime;
                accumulatedBreakMinutes += brakeDurationMinutes;

                await examsCollection.updateOne(
                    { examName: examName, [`classes.${className}.students._id`]: student._id },
                    {
                        $set: {
                            [`classes.${className}.students.$.examStartTime`]: newStartTime,
                            [`classes.${className}.students.$.examEndTime`]: newEndTime,
                        }
                    }
                );
                console.log(`API - /api/brake - Updated student _id:`, student._id, "in MongoDB");
            }
        } else {
            console.log("API - /api/brake - No student found with start time after brake start time, or brake is ending, student times not updated.");
        }

        return NextResponse.json({ message: 'Brake record updated and student times updated (if brake started)!' }, { status: 200 });

    } catch (error: any) {
        console.error("API Error submitting/updating brake time:", error);
        return NextResponse.json({ message: 'Failed to submit/update brake time to MongoDB and update student times.', error: error.message }, { status: 500 });
    }
}