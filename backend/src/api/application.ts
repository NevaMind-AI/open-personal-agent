import { Application, Router } from 'express';
import { findMany, findOne } from '../db/jsonDb';
import { APPLICATIONS_COLLECTION, APPLICATION_RUNNING_TASKS_COLLECTION } from '../db/models/application/consts';
import { ApplicationTask } from '../db/models/application/types';

const router = Router();

// Get the current running task info
router.get('/application/running-task', async (_req, res) => {
    try {
        const running = await findOne<ApplicationTask>(APPLICATION_RUNNING_TASKS_COLLECTION, { status: 'running' });
        res.json({ data: running ?? null });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// Get all Applications
router.get('/applications', async (_req, res) => {
    try {
        const apps = await findMany<Application>(APPLICATIONS_COLLECTION, {});
        res.json({ data: apps });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

export default router;


