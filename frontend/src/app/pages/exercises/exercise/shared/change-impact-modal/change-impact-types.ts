import type { Vehicle, ElementDto } from 'fuesim-digital-shared';

type InExerciseElement = Vehicle;

export type ChangeImpact =
    | AddedElementChangeImpact
    | EditableElementChangeImpact
    | RemovedElementChangeImpact;

export interface AddedElementChangeImpact {
    id: string;
    type: 'added';
    element: ElementDto;
}

export interface RemovedElementChangeImpact {
    id: string;
    type: 'removed';
    element: InExerciseElement;
    entity: ElementDto;
}

export interface EditableElementChangeImpact {
    id: string;
    type: 'editable';
    element: InExerciseElement;
    oldValue: string;
    currentValue: string;
    newValue: string;
}
