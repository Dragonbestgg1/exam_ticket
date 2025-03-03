import getMongoClientPromise from '@/app/lib/mongodb';

export async function POST(req: Request) {
    try {
        const { studentUUID, documentId } = await req.json();
        
        if (!studentUUID || !documentId) {
            return new Response(JSON.stringify({ error: 'Missing studentUUID or documentId' }), { status: 400 });
        }

        // Connect to the database using your existing MongoDB client logic
        const client = await getMongoClientPromise();
        const db = client.db('ExamTicket');  // Access the "ExamTicket" database

        // Find all break records for the given student and exam document
        const breaks = await db.collection('brake')  // Use the "brake" collection
            .find({
                studentUUID,
                documentId,
            })
            .toArray();

        if (breaks.length === 0) {
            return new Response(JSON.stringify({ error: 'No break records found for this student.' }), { status: 404 });
        }

        // Get current time and adjust for Riga (UTC+2)
        const currentTime = new Date();
        const adjustedCurrentTime = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // UTC+2

        let closestBreak = null;
        let closestTimeDiff = Infinity;

        breaks.forEach(breakRecord => {
            // Construct the break start and end times using current date (adjusted for UTC+2)
            const breakStartTime = new Date(adjustedCurrentTime.toDateString() + ' ' + breakRecord.startTime);

            // Calculate the difference between adjusted current time and break start time
            const timeDiff = Math.abs(adjustedCurrentTime.getTime() - breakStartTime.getTime());

            // Check if this break is the closest one
            if (timeDiff < closestTimeDiff) {
                closestBreak = breakRecord;
                closestTimeDiff = timeDiff;
            }
        });

        if (!closestBreak) {
            return new Response(JSON.stringify({ error: 'No valid break period found.' }), { status: 404 });
        }

        // Return the closest break
        return new Response(JSON.stringify({
            isBreakActive: closestBreak.isBreakActive,
            startTime: closestBreak.startTime,
            endTime: closestBreak.endTime,
        }), { status: 200 });
    } catch (error) {
        console.error('Error fetching break status:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
