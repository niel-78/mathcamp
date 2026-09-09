const importJobs = new Map();

export function createImportJob({ jobId, fileName, userId }) {
    const job = {
        id: jobId,
        fileName: fileName || "import.xlsx",
        userId,
        status: "queued",
        progress: 0,
        message: "Förbereder import...",
        totalRows: 0,
        processedRows: 0,
        questionCount: 0,
        blockId: null,
        error: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    importJobs.set(jobId, job);
    return job;
}

export function getImportJob(jobId) {
    return importJobs.get(jobId) || null;
}

export function updateImportJob(jobId, patch = {}) {
    const job = importJobs.get(jobId);

    if (!job) {
        return null;
    }

    Object.assign(job, patch, {
        updatedAt: new Date().toISOString()
    });

    if (
        patch.totalRows !== undefined &&
        patch.processedRows !== undefined &&
        patch.totalRows > 0
    ) {
        job.progress = Math.min(
            100,
            Math.round((patch.processedRows / patch.totalRows) * 100)
        );
    }

    if (patch.status === "completed") {
        job.progress = 100;
    }

    return job;
}

export function removeImportJob(jobId) {
    importJobs.delete(jobId);
}
