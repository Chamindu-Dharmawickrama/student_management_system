import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { getEmailProvider } from './email.provider.js';
import { claimNextEmailJob, markEmailJobSent, resetStuckEmailJobs, updateEmailJobAfterFailure } from './email.repository.js';
import { templateRegistry } from './email.templates.js';

// How often the worker polls for new PENDING jobs (ms)
const POLL_INTERVAL_MS = config.emailWorkerPollMs;
// Max send attempts before a job is moved to FAILED (stops retrying)
const MAX_ATTEMPTS = config.emailWorkerMaxAttempts;
// Jobs stuck in PROCESSING longer than this are recovered back to PENDING
const STUCK_TIMEOUT_MS = config.emailWorkerStuckJobTimeoutMs;

// Backoff constants
const BASE_BACKOFF_MS = 5_000;               // 5 seconds
const MAX_BACKOFF_MS = 30 * 60 * 1000;     // 30 minutes = 


// compute next attempt time using exponential backoff + jitter
function nextAttemptAt(attempts) {
    // exponential - multiplying by a fixed factor 
    const exponential = BASE_BACKOFF_MS * Math.pow(2, attempts - 1);
    // jitter - adding a random delay to prevent multiple jobs from being retried at the exact same time
    const jitterMs = Math.random() * 1000; // 0–1 s jitter
    const delayMs = Math.min(exponential + jitterMs, MAX_BACKOFF_MS);

    return new Date(Date.now() + delayMs);
}

/**
 * Process a single claimed job:
 *   1. Resolve template by type.
 *   2. Render the template.
 *   3. Send via the active provider.
 *   4. Update status: SENT on success, PENDING (with backoff) or FAILED on error. 
**/
async function processOneJob(job) {

    // get the the template 
    const template = templateRegistry[job.type];

    if (!template) {
        logger.error('[EmailWorker] Unknown email type — marking job as FAILED', {
            jobId: job.id,
            type: job.type,
        });
        await updateEmailJobAfterFailure(job.id, {
            attempts: job.attempts + 1,
            lastError: `Unknown email type: ${job.type}`,
            status: 'FAILED',
            nextAttemptAt: null,
        });
        return;
    }

    // render the email template
    let rendered;
    try {
        rendered = template.render(job.payload);
    } catch (err) {
        logger.error('[EmailWorker] Template render failed — marking job as FAILED', {
            jobId: job.id,
            type: job.type,
            error: err.message,
        });
        await updateEmailJobAfterFailure(job.id, {
            attempts: job.attempts + 1,
            lastError: `Render error: ${err.message}`,
            status: 'FAILED',
            nextAttemptAt: null,
        });
        return;
    }

    // send mail via the provider
    const provider = getEmailProvider();

    try {
        const { providerId } = await provider.send({
            to: job.recipient,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
        });

        // mark as email job done
        await markEmailJobSent(job.id, providerId);

        logger.info('[EmailWorker] Email sent successfully', {
            jobId: job.id,
            type: job.type,
            recipient: job.recipient,
            providerId,
        });

    } catch (err) {
        // check if we have reached max attempts
        const newAttempts = job.attempts + 1;
        const isMaxed = newAttempts >= MAX_ATTEMPTS;

        logger.warn('[EmailWorker] Email send failed', {
            jobId: job.id,
            type: job.type,
            attempt: newAttempts,
            maxAttempts: MAX_ATTEMPTS,
            error: err.message,
            willRetry: !isMaxed,
        });

        // if max attempts not reached => schedule next attempt using exponential backoff
        // else => mark as FAILED
        await updateEmailJobAfterFailure(job.id, {
            attempts: newAttempts,
            lastError: err.message,
            status: isMaxed ? 'FAILED' : 'PENDING',
            nextAttemptAt: isMaxed ? null : nextAttemptAt(newAttempts),
        });
    }
}


/**
 * One poll cycle:
 *   1. Recover any stuck PROCESSING jobs.
 *   2. Find all PENDING jobs whose nextAttemptAt is due or null.
 */
async function processEmailJobs() {
    try {
        // recover stuck processing email jobs
        await resetStuckEmailJobs(STUCK_TIMEOUT_MS);

        let job;

        while ((job = await claimNextEmailJob()) !== null){
            await processOneJob(job);
        }

    } catch (err) {
        logger.error('[EmailWorker] Poll cycle error -', {
            error: err.message,
            stack: err.stack,
        });
        console.log(err.message)
    }
}


// Start the email worker.
export const startEmailWorker = () => {

    // run one cycle immediately 
    processEmailJobs();

    // run "processEmailJobs" repeatedly in scheduled manner
    const timer = setInterval(processEmailJobs, POLL_INTERVAL_MS);
    timer.unref();

    logger.info('[EmailWorker] Email worker started', {
        pollIntervalMs: POLL_INTERVAL_MS,
        maxAttempts: MAX_ATTEMPTS,
        stuckTimeoutMs: STUCK_TIMEOUT_MS,
    });
}