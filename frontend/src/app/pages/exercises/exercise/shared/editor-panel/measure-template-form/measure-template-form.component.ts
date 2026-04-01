import type { OnChanges } from '@angular/core';
import { Component, inject, input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    measurePropertyTypeSchema,
    type MeasureProperty,
    type MeasurePropertyType,
} from 'fuesim-digital-shared';
import { cloneDeep } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import { MessageService } from '../../../../../../core/messages/message.service';
import type { SimpleChangesGeneric } from '../../../../../../shared/types/simple-changes-generic';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectMaterialTemplates,
    selectPersonnelTemplates,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { DisplayValidationComponent } from '../../../../../../shared/validation/display-validation/display-validation.component';
import { ImageExistsValidatorDirective } from '../../../../../../shared/validation/image-exists-validator.directive';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { IntegerValidatorDirective } from '../../../../../../shared/validation/integer-validator.directive';
import { MapEditorCardComponent } from '../map-editor-card/map-editor-card.component';
import { ValuesPipe } from '../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-measure-template-form',
    templateUrl: './measure-template-form.component.html',
    styleUrl: './measure-template-form.component.scss',
    imports: [
    FormsModule,
    DisplayValidationComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem
],
})
export class MeasureTemplateFormComponent implements OnChanges {
    private readonly messageService = inject(MessageService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly initialValues = input.required<EditableMeasureTemplateValues>();
    readonly btnText = input.required<string>();

    /**
     * Emits the changed values
     */
    readonly submitMeasureTemplate = output<ChangedMeasureTemplateValues>();

    public values?: EditableMeasureTemplateValues;

    public materialTemplates$ = this.store.select(selectMaterialTemplates);
    public personnelTemplates$ = this.store.select(selectPersonnelTemplates);

    public readonly measureProperties = measurePropertyTypeSchema;

    ngOnChanges(_changes: SimpleChangesGeneric<this>): void {
        this.values = {
            ...this.initialValues(),
            ...this.values,
        };
    }

    /**
     * Emits the changed values via submitMeasureTemplate
     * This method must only be called if all values are valid
     */
    public async submit() {
        if (!this.values) {
            return;
        }
        const valuesOnSubmit = cloneDeep(this.values);
        this.submitMeasureTemplate.emit({
            name: valuesOnSubmit.name!,
            properties: valuesOnSubmit.properties,
        });
    }

    public addProperty(propertyType: MeasurePropertyType) {
        if (!this.values) {
            return;
        }
        console.log('Adding property ', propertyType);
        // this.values.properties.push({type: propertyType, });
    }

    public removeProperty(index: number) {
        if (!this.values) {
            return;
        }
        this.values.properties.splice(index, 1);
    }
}

export interface EditableMeasureTemplateValues {
    name: string | null;
    properties: MeasureProperty[];
}

export interface ChangedMeasureTemplateValues {
    name: string;
    properties: MeasureProperty[];
}
