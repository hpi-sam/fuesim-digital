import type { Vehicle, ElementDto } from 'fuesim-digital-shared';

export type InExerciseElement = Vehicle;

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
    element: InExerciseElement;
    entity: ElementDto;
}

export interface EditableElementChangeImpact {
    id: string;
    type: 'updated';
    editedValues: { id: string; name: string }[];
    element: InExerciseElement;
    entity: ElementDto;
}
