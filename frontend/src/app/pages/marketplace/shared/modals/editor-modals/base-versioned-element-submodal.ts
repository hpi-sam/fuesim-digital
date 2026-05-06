import type { InputSignal, OutputEmitterRef } from '@angular/core';
import type {
    ElementDto,
    Marketplace,
    TypedElementDto,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import type { Immutable } from 'immer';

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
    availableCollectionElements: Immutable<ElementDto[]>;
}

export interface CreatingVersionedElementModalData<T>
    extends SharedVersionedElementModalData<T> {
    mode: 'create';
}

export interface EditingVersionedElementModalData<T>
    extends SharedVersionedElementModalData<T> {
    mode: 'edit' | 'view';
    element: TypedElementDto<T>;
    hideVersionHistory?: boolean;
}

export type VersionedElementModalData<T> =
    | CreatingVersionedElementModalData<T>
    | EditingVersionedElementModalData<T>;
