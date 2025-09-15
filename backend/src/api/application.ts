import { Application, Router } from 'express';
import { findMany, findOne } from '../db/jsonDb';
import { APPLICATIONS_COLLECTION, APPLICATION_RUNNING_TASKS_COLLECTION } from '../db/models/application/consts';
import { ApplicationTask } from '../db/models/application/types';

const router = Router();

// 获取当前 running 的 task 信息
router.get('/application/running-task', async (_req, res) => {
    try {
        const running = await findOne<ApplicationTask>(APPLICATION_RUNNING_TASKS_COLLECTION, { status: 'running' });
        res.json({ data: running ?? null });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// 获取当前所有 Application
router.get('/applications', async (_req, res) => {
    try {
        const apps = await findMany<Application>(APPLICATIONS_COLLECTION, {});
        res.json({ data: apps });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

export default router;


