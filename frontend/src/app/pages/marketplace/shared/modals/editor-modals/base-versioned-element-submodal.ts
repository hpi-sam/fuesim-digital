import type { InputSignal, OutputEmitterRef } from '@angular/core';
import type {
    TemplateVersion,
    Marketplace,
    MarketplaceElementContent,
    TypedTemplateVersion,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import type { Immutable } from 'immer';

export abstract class BaseVersionedElementSubmodal<T> {
    public abstract data: InputSignal<VersionedElementModalData<T>>;
    public abstract btnText: InputSignal<string>;
    public abstract disabled: InputSignal<boolean>;

    public abstract readonly dataSubmit: OutputEmitterRef<T>;
    public abstract readonly discardChanges: OutputEmitterRef<void>;
}

export interface SharedVersionedElementModalData<T> {
    onSubmit: (
        values: T,
        conflictResolution?: Marketplace.Element.EditConflictResolution
    ) => void;
    type: MarketplaceElementContent['type'];
    collection: VersionedCollectionPartial;
    availableCollectionElements: Immutable<TemplateVersion[]>;
}

export interface CreatingVersionedElementModalData<
    T,
> extends SharedVersionedElementModalData<T> {
    mode: 'create';
}

export interface EditingVersionedElementModalData<
    T,
> extends SharedVersionedElementModalData<T> {
    mode: 'edit' | 'view';
    element: TypedTemplateVersion<T>;
    hideVersionHistory?: boolean;
}

export type VersionedElementModalData<T> =
    | CreatingVersionedElementModalData<T>
    | EditingVersionedElementModalData<T>;
