import { getPrisma } from "../../config/database";

// create a new record in email table for later send email, txOrDb => (PrismaClient or Transaction)
export const createEmailJob = (txOrDb, { type, recipient, payload }) => {
    return txOrDb.emailJob.create({
        data: {
            type,
            recipient,
            payload
        }
    })
}

// update email job after failure
export const updateEmailJobAfterFailure = (id, { attempts, lastError, status, nextAttemptAt }) => {
    const db = getPrisma();
    return db.emailJob.update({
        where: { id },
        data: {
            status,
            attempts,
            lastError,
            lockedAt: null,
            nextAttemptAt: nextAttemptAt ?? null,
        },
    });
}

// mark email job as sent
export const markEmailJobSent = (id, providerId) => {
    const db = getPrisma();
    return db.emailJob.update({
        where: { id },
        data: {
            status: 'SENT',
            providerId: providerId ?? null,
            lockedAt: null,
        },
    });
};

// Reset stuck email jobs
export const resetStuckEmailJobs = async (stuckTimeoutMs) => {
    const db = getPrisma();
    const cutoff = new Date(Date.now() - stuckTimeoutMs);

    // Update the status where the lockedAt time is before 5 min (it means the email job is stuck)
    const result = await db.$queryRaw`
    UPDATE "EmailJob"
    SET
        status    = 'PENDING'::"EmailJobStatus",
        "lockedAt"  = NULL,
        "updatedAt" = NOW()
    WHERE  status    = 'PROCESSING'::"EmailJobStatus"
        AND "lockedAt" < ${cutoff}  
    `;

    return result;
}

// select the next email job
export const claimNextEmailJob = async () => {
    const db = getPrisma();

    // status should be "PENDING" and "nextAttemptAt" should be null or less than or equal to current time
    // return the first job in the queue
    const rows = await db.$queryRaw`
    UPDATE "EmailJob"
        SET
            status    = 'PROCESSING'::"EmailJobStatus",
            "lockedAt"  = NOW(),
            "updatedAt" = NOW()
        WHERE id = (
            SELECT id
            FROM   "EmailJob"
            WHERE  status = 'PENDING'::"EmailJobStatus"
              AND  ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
            ORDER  BY "createdAt" ASC
            LIMIT  1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING *
    `;

    return rows[0] ?? null;
}    