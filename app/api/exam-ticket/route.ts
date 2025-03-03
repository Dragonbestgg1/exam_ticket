import getMongoClientPromise from '@/app/lib/mongodb';

export async function POST(req: Request) {
    try {
        const { studentUUID, documentId } = await req.json();
        
        if (!studentUUID || !documentId) {
            return new Response(JSON.stringify({ error: 'Missing studentUUID or documentId' }), { status: 400 });
        }

        const client = await getMongoClientPromise();
        const db = client.db('ExamTicket');

        const breaks = await db.collection('brake')
            .find({
                studentUUID,
                documentId,
            })
            .toArray();

        if (breaks.length === 0) {
            return new Response(JSON.stringify({ error: 'No break records found for this student.' }), { status: 404 });
        }

        const currentTime = new Date();
        const adjustedCurrentTime = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000);

        let closestBreak = null;
        let closestTimeDiff = Infinity;

        breaks.forEach(breakRecord => {
            const breakStartTime = new Date(adjustedCurrentTime.toDateString() + ' ' + breakRecord.startTime);

            const timeDiff = Math.abs(adjustedCurrentTime.getTime() - breakStartTime.getTime());

            if (timeDiff < closestTimeDiff) {
                closestBreak = breakRecord;
                closestTimeDiff = timeDiff;
            }
        });

        if (!closestBreak) {
            return new Response(JSON.stringify({ error: 'No valid break period found.' }), { status: 404 });
        }

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
