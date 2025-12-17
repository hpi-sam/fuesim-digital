import type { HttpResponse } from '../utils.js';

export function getHealth(): HttpResponse<{ status: string }> {
    return {
        statusCode: 200,
        body: {
            status: 'API running',
        },
    };
}
