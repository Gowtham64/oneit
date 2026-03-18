/**
 * Simple in-memory job queue for HRMS-triggered operations
 * For production, consider using Redis or a proper job queue like Bull
 */

interface Job {
    id: string;
    type: 'onboarding' | 'offboarding';
    data: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    processedAt?: Date;
    error?: string;
    retryCount: number;
}

const jobQueue: Job[] = [];
const MAX_RETRIES = 3;
let isProcessing = false;

/**
 * Generate unique job ID
 */
function generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add onboarding job to queue
 */
export async function enqueueOnboarding(employeeData: any): Promise<string> {
    const job: Job = {
        id: generateJobId(),
        type: 'onboarding',
        data: employeeData,
        status: 'pending',
        createdAt: new Date(),
        retryCount: 0,
    };

    jobQueue.push(job);
    console.log(`Onboarding job queued: ${job.id} for ${employeeData.email}`);

    // Start processing if not already running
    if (!isProcessing) {
        processQueue();
    }

    return job.id;
}

/**
 * Add offboarding job to queue
 */
export async function enqueueOffboarding(employeeData: any): Promise<string> {
    const job: Job = {
        id: generateJobId(),
        type: 'offboarding',
        data: employeeData,
        status: 'pending',
        createdAt: new Date(),
        retryCount: 0,
    };

    jobQueue.push(job);
    console.log(`Offboarding job queued: ${job.id} for ${employeeData.email}`);

    // Start processing if not already running
    if (!isProcessing) {
        processQueue();
    }

    return job.id;
}

/**
 * Process jobs in the queue
 */
async function processQueue() {
    if (isProcessing) return;

    isProcessing = true;

    while (jobQueue.length > 0) {
        const job = jobQueue.find(j => j.status === 'pending');

        if (!job) break;

        job.status = 'processing';
        console.log(`Processing job: ${job.id} (${job.type})`);

        try {
            if (job.type === 'onboarding') {
                await executeOnboarding(job.data);
            } else if (job.type === 'offboarding') {
                await executeOffboarding(job.data);
            }

            job.status = 'completed';
            job.processedAt = new Date();
            console.log(`Job completed: ${job.id}`);

        } catch (error: any) {
            console.error(`Job failed: ${job.id}`, error);
            job.error = error.message;

            // Retry logic
            if (job.retryCount < MAX_RETRIES) {
                job.retryCount++;
                job.status = 'pending';
                console.log(`Retrying job: ${job.id} (attempt ${job.retryCount}/${MAX_RETRIES})`);
            } else {
                job.status = 'failed';
                console.error(`Job permanently failed: ${job.id}`);
            }
        }

        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    isProcessing = false;
}

/**
 * Execute onboarding workflow
 */
async function executeOnboarding(employeeData: any) {
    const { executeAutomatedOnboarding } = await import('@/lib/automated-workflows');
    await executeAutomatedOnboarding(employeeData);
}

/**
 * Execute offboarding workflow
 */
async function executeOffboarding(employeeData: any) {
    const { executeAutomatedOffboarding } = await import('@/lib/automated-workflows');
    await executeAutomatedOffboarding(employeeData);
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): Job | undefined {
    return jobQueue.find(j => j.id === jobId);
}

/**
 * Get all jobs
 */
export function getAllJobs(): Job[] {
    return [...jobQueue];
}

/**
 * Get recent jobs (last 50)
 */
export function getRecentJobs(limit: number = 50): Job[] {
    return jobQueue
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
}

/**
 * Clear completed jobs older than 24 hours
 */
export function cleanupOldJobs() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (let i = jobQueue.length - 1; i >= 0; i--) {
        const job = jobQueue[i];
        if (job.status === 'completed' && job.processedAt && job.processedAt < oneDayAgo) {
            jobQueue.splice(i, 1);
        }
    }
}

// Run cleanup every hour
setInterval(cleanupOldJobs, 60 * 60 * 1000);
