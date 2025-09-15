export type Application = {
    id: string;
    projectName: string;
    description: string;
    prompt: string;
    createdAt: string;
    updatedAt: string;
};

export type ApplicationTask = {
    id: string;
    projectName: string;
    description: string;
    status: ApplicationTaskStatus;
    prompt: string;
    createdAt: string;
    updatedAt: string;
};

export type ApplicationTaskStatus = "running" | "completed" | "failed";