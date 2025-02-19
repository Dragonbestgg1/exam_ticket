import { NextResponse, NextRequest } from "next/server";
import getMongoClientPromise from "@/app/lib/mongodb";

interface Student {
  _id: string;
  examStartTime: string;
  examDuration: number;
  examEndTime: string;
}

const parseTimeToMinutes = (timeString: string): number => {
  if (!timeString) return 0;
  if (typeof timeString !== "string") return 0;
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const {
      brakeMinutes,
      startTime,
      endTime,
      isBreakActive,
      examName,
      className,
    } = requestBody;

    if (!examName || !className) {
      return NextResponse.json(
        { message: "Missing required data (examName, className) ..." },
        { status: 400 }
      );
    }

    const mongoClientPromise = await getMongoClientPromise();
    const client = await mongoClientPromise;
    const db = client.db("ExamTicket");
    const brakesCollection = db.collection("brake");
    const examsCollection = db.collection("exams");

    const existingBrake = await brakesCollection.findOne({
      examName: examName,
      className: className,
    });

    if (existingBrake) {
      await brakesCollection.updateOne(
        { examName: examName, className: className },
        {
          $set: {
            startTime: startTime,
            interval: brakeMinutes
              ? parseInt(brakeMinutes, 10)
              : existingBrake.interval,
            endTime: endTime,
            isBreakActive: isBreakActive,
            timestamp: new Date(),
          },
        }
      );
    } else {
      if (!brakeMinutes || !startTime || !endTime) {
        return NextResponse.json(
          {
            message:
              "Missing required data (brakeMinutes, startTime, endTime) for new brake ...",
          },
          { status: 400 }
        );
      }
      await brakesCollection.insertOne({
        startTime,
        interval: parseInt(brakeMinutes, 10),
        endTime,
        isBreakActive,
        examName,
        className,
        timestamp: new Date(),
      });
    }

    const exam = await examsCollection.findOne({ examName: examName });

    if (
      !exam ||
      !exam.classes ||
      !exam.classes[className] ||
      !exam.classes[className].students ||
      !Array.isArray(exam.classes[className].students)
    ) {
      return NextResponse.json(
        { message: "Exam not found or students data is missing." },
        { status: 404 }
      );
    }

    const brakeStartTimeMinutes = parseTimeToMinutes(startTime);
    const brakeDurationMinutes = parseInt(brakeMinutes, 10);

    let closestStudentIndex = -1;
    let minTimeDiff = Infinity;

    exam.classes[className].students.forEach(
      (student: Student, index: number) => {
        const studentStartTimeMinutes = parseTimeToMinutes(student.examStartTime);
        const timeDiff = studentStartTimeMinutes - brakeStartTimeMinutes;
        if (timeDiff >= 0 && timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestStudentIndex = index;
        }
      }
    );

    if (closestStudentIndex !== -1 && isBreakActive === true) {
      let accumulatedBreakMinutes = 0;
      for (
        let i = closestStudentIndex;
        i < exam.classes[className].students.length;
        i++
      ) {
        const student: Student = exam.classes[className].students[i];
        if (!student) continue;

        const currentStartTimeMinutes = parseTimeToMinutes(
          student.examStartTime
        );
        const currentDurationMinutes = student.examDuration;

        const newStartTimeMinutes =
          currentStartTimeMinutes +
          brakeDurationMinutes +
          accumulatedBreakMinutes;
        const newEndTimeMinutes = newStartTimeMinutes + currentDurationMinutes;

        const newStartTime = formatMinutesToTime(newStartTimeMinutes);
        const newEndTime = formatMinutesToTime(newEndTimeMinutes);

        exam.classes[className].students[i].examStartTime = newStartTime;
        exam.classes[className].students[i].examEndTime = newEndTime;
        accumulatedBreakMinutes += brakeDurationMinutes;

        await examsCollection.updateOne(
          {
            examName: examName,
            [`classes.${className}.students._id`]: student._id,
          },
          {
            $set: {
              [`classes.${className}.students.$.examStartTime`]: newStartTime,
              [`classes.${className}.students.$.examEndTime`]: newEndTime,
            },
          }
        );
      }
    }

    return NextResponse.json(
      {
        message:
          "Brake record updated and student times updated (if brake started)!",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    let errorMessage = "Failed to submit/update brake time to MongoDB and update student times.";
    if (error instanceof Error) {
      errorMessage += ` Error: ${error.message}`;
    } else {
      errorMessage += ` Unknown error: ${String(error)}`;
    }
    return NextResponse.json(
      {
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}