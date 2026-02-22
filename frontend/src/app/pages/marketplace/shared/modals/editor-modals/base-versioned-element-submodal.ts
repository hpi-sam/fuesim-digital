import { InjectionToken, type InputSignal } from '@angular/core';
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

    public abstract readonly formOutput: FormOutput;
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

interface FormOutput {
    dataSubmit: (data: any) => void;
    discardChanges: () => void;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const FormOutputInjectionToken = new InjectionToken<FormOutput>(
    'FormOutputInjectionToken'
);
