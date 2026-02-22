import { InputSignal, OutputEmitterRef } from '@angular/core';
import { VersionedElementModalData } from './versioned-element-modal/versioned-element-modal.component';

export abstract class BaseVersionedElementSubmodal<T> {
    public abstract data: InputSignal<VersionedElementModalData<T>>;
    public abstract btnText: InputSignal<string>;
    public abstract disabled: InputSignal<boolean>;

    public abstract readonly submit: OutputEmitterRef<T>;
}
