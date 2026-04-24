import { IsString, IsUUID } from 'class-validator';
import { WritableDraft } from 'immer';
import type { ExerciseState } from '../../state.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    type MapImageTemplate,
    mapImageTemplateSchema,
} from '../../models/map-image-template.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from '../../models/utils/image-properties.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';

export class AddMapImageTemplateAction implements Action {
    @IsValue('[MapImageTemplate] Add mapImageTemplate' as const)
    public readonly type = '[MapImageTemplate] Add mapImageTemplate';

    @IsZodSchema(mapImageTemplateSchema)
    public readonly mapImageTemplate!: MapImageTemplate;
}

export class EditMapImageTemplateAction implements Action {
    @IsValue('[MapImageTemplate] Edit mapImageTemplate' as const)
    public readonly type = '[MapImageTemplate] Edit mapImageTemplate';

    @IsUUID(4, uuidValidationOptions)
    public readonly id!: UUID;

    @IsString()
    public readonly name!: string;

    @IsZodSchema(imagePropertiesSchema)
    public readonly image!: ImageProperties;
}

export class DeleteMapImageTemplateAction implements Action {
    @IsValue('[MapImageTemplate] Delete mapImageTemplate' as const)
    public readonly type = '[MapImageTemplate] Delete mapImageTemplate';

    @IsUUID(4, uuidValidationOptions)
    public readonly id!: UUID;
}

export namespace MapImageTemplatesActionReducers {
    export const addMapImageTemplate: ActionReducer<AddMapImageTemplateAction> =
        {
            action: AddMapImageTemplateAction,
            reducer: (draftState, { mapImageTemplate }) => {
                if (draftState.mapImageTemplates[mapImageTemplate.id]) {
                    throw new ReducerError(
                        `MapImageTemplate with id ${mapImageTemplate.id} already exists`
                    );
                }
                draftState.mapImageTemplates[mapImageTemplate.id] =
                    cloneDeepMutable(mapImageTemplate);
                return draftState;
            },
            rights: 'trainer',
        };

    export const editMapImageTemplate: ActionReducer<EditMapImageTemplateAction> =
        {
            action: EditMapImageTemplateAction,
            reducer: (draftState, { id, name, image }) => {
                const mapImageTemplate = getMapImageTemplate(draftState, id);
                mapImageTemplate.name = name;
                mapImageTemplate.image = cloneDeepMutable(image);
                return draftState;
            },
            rights: 'trainer',
        };

    export const deleteMapImageTemplate: ActionReducer<DeleteMapImageTemplateAction> =
        {
            action: DeleteMapImageTemplateAction,
            reducer: (draftState, { id }) => {
                getMapImageTemplate(draftState, id);
                delete draftState.mapImageTemplates[id];
                return draftState;
            },
            rights: 'trainer',
        };
}

function getMapImageTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<MapImageTemplate> {
    const mapImageTemplate = state.mapImageTemplates[id];
    if (!mapImageTemplate) {
        throw new ReducerError(`MapImageTemplate with id ${id} does not exist`);
    }
    return mapImageTemplate;
}
