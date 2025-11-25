import type { ExerciseAction, UUID } from 'digital-fuesim-manv-shared';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { actionWrapperTable } from 'database/schema.js';
import type { DatabaseTransaction } from 'database/services/database-service.js';
import { NormalType } from '../database/normal-type.js';
import type { DatabaseService } from '../database/services/database-service.js';
import type { ExerciseWrapper } from './exercise-wrapper.js';

export class ActionWrapper extends NormalType<typeof actionWrapperTable> {
    public override async save(
        database?: DatabaseTransaction | null
    ): Promise<any> {
        if (this.exercise.entity.id === undefined) {
            await this.exercise.save();
        }

        const patch: InferInsertModel<typeof actionWrapperTable> = {
            actionString: this.entity.actionString,
            emitterId: this.entity.emitterId,
            // id expected to be set after save, see above
            exerciseId: this.exercise.entity.id!,
            index: this.entity.index,
        };

        if (this.entity.id !== undefined) {
            patch.id = this.entity.id;
        }

        const insert = await (database ?? this.databaseService)
            .insert(actionWrapperTable)
            .values(patch)
            .onConflictDoUpdate({
                target: actionWrapperTable.id,
                set: patch,
            })
            .returning();

        if (insert.length > 0 && insert[0]?.id !== undefined) {
            this.entity.id = insert[0].id;
        }
    }

    public static createFromDatabase(
        dbEntry: InferSelectModel<typeof actionWrapperTable>,
        databaseService: DatabaseService,
        exercise: ExerciseWrapper
    ): ActionWrapper {
        return new ActionWrapper(
            databaseService,
            dbEntry.actionString,
            dbEntry.emitterId,
            exercise,
            dbEntry.index,
            dbEntry.id
        );
    }

    /**
     * @param emitterId `null` iff the emitter was the server, the client id otherwise
     */
    public constructor(
        databaseService: DatabaseService,
        action: ExerciseAction,
        emitterId: UUID | null,
        public readonly exercise: ExerciseWrapper,
        index?: number,
        id?: UUID
    ) {
        super(databaseService);

        this.entity = {
            actionString: action,
            emitterId,
            index: index ?? exercise.incrementIdGenerator.next(),
            id: id ?? undefined,
            // safe, bc actions reference different exercise variable for saving to DB
            exerciseId: exercise.entity.id ?? '',
        };
    }
}
