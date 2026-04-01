import type { InputSignal, OutputEmitterRef } from '@angular/core';
import type {
    ElementDto,
    Marketplace,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';

export abstract class BaseVersionedElementSubmodal<T> {
    public abstract data: InputSignal<VersionedElementModalData<T>>;
    public abstract btnText: InputSignal<string>;
    public abstract disabled: InputSignal<boolean>;

    public abstract readonly dataSubmit: OutputEmitterRef<T>;
}

export interface SharedVersionedElementModalData<T> {
    onSubmit: (
        values: T,
        conflictResolution?: Marketplace.Element.EditConflictResolution
    ) => void;
    type: VersionedElementContent['type'];
    collection: VersionedCollectionPartial;
    isEditMode: boolean;
    availableCollectionElements: ElementDto[];
}

export interface CreatingVersionedElementModalData<T>
    extends SharedVersionedElementModalData<T> {
    isEditMode: false;
}

export interface EditingVersionedElementModalData<T>
    extends SharedVersionedElementModalData<T> {
    isEditMode: true;
    element: ElementDto;
}

export type VersionedElementModalData<T> =
    | CreatingVersionedElementModalData<T>
    | EditingVersionedElementModalData<T>;
