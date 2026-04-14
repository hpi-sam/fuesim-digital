import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const impossibleMigration: Migration = {
    action: (intermediaryState, actions) => {
        throw new RestoreError(
            'The migration is not possible',
            (intermediaryState as { id?: UUID }).id ?? 'unknown'
        );
    },
    state: (state) => {
        throw new RestoreError(
            'The migration is not possible',
            (state as { id?: UUID }).id ?? 'unknown'
        );
    },
};

// TODO: Rename into `MigrationError` (upstream changes in the backend)
class RestoreError extends Error {
    public constructor(
        message: string,
        public readonly exerciseId: UUID,
        innerError?: Error
    ) {
        super(`Failed to restore exercise \`${exerciseId}\`: ${message}`);
        this.cause = innerError;
    }
}
