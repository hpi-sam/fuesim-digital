import type { Vehicle, ElementDto, Element as FuesimElement } from 'fuesim-digital-shared';
import { z } from 'zod';

export type ChangeImpact =
    | AddedElementChangeImpact
    | EditableElementChangeImpact
    | RemovedElementChangeImpact;

export interface AddedElementChangeImpact {
    id: string;
    type: 'added';
    entity: ElementDto;
}

export interface RemovedElementChangeImpact {
    id: string;
    type: 'removed';
    element: FuesimElement;
    entity: ElementDto;
}

export interface EditableElementChangeImpact {
    id: string;
    type: 'updated';
    editedValues: { id: string; name: string }[];
    element: FuesimElement;
    entity: ElementDto;
}

export type ChangeApply = AddedChangeApply | EditableChangeApply | RemoveChangeApply;

export const removeChangeApplyActionSchema = z.literal([
    'remove',
    'replace',
    'placeholder',
]);

export interface RemoveChangeApply {
    type: 'removed';
    change: RemovedElementChangeImpact;
    action: z.infer<typeof removeChangeApplyActionSchema>;
    replaceWith?: ElementDto;
}

export interface EditableChangeApply {
    type: 'editable';
    action: 'keep' | 'update';
}

export interface AddedChangeApply {
    type: 'added';
    action: 'keep';
}
