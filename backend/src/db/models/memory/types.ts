export enum MemuTaskStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
}

export interface MemuRetrieve {
    id: string;
    sessionId: string;
    nowRetrieve?: MemuRetrieveHistory;
    history: MemuRetrieveHistory[];
}

export interface MemuRetrieveHistory {
    summaryRange?: [number, number];
    summaryTaskId?: string;
    summary?: string;
}

export interface MemuSummaryTask {
    id: string;
    sessionId: string;
    summaryRange: [number, number];
    summaryTaskId?: string;
    summaryTaskStatus: MemuTaskStatus;
}