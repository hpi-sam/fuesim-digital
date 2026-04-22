import type { OnChanges } from '@angular/core';
import { Component, inject, input, output, signal } from '@angular/core';
import {
    CdkDrag,
    CdkDragDrop,
    CdkDropList,
    moveItemInArray,
    CdkDragHandle,
    CdkDragPlaceholder,
    CdkDragPreview,
} from '@angular/cdk/drag-drop';
import {
    measurePropertySchema,
    measurePropertyTypeSchema,
    measurePropertyTypeToGermanNameDictionary,
    measureTemplateSchema,
    type MeasureProperty,
    type MeasurePropertyType,
} from 'fuesim-digital-shared';
import { cloneDeep } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { z, ZodError } from 'zod';
import {
    form,
    FormField,
    FieldTree,
    validateStandardSchema,
    disabled,
} from '@angular/forms/signals';
import { MessageService } from '../../../../../../core/messages/message.service';
import type { SimpleChangesGeneric } from '../../../../../../shared/types/simple-changes-generic';
import { DisplayModelValidationComponent } from '../../../../../../shared/validation/display-model-validation/display-model-validation.component';
import {
    EditableAlarmProperty,
    EditableDelayProperty,
    EditableDrawFreehandProperty,
    EditableDrawLineProperty,
    EditableEocLogProperty,
    EditableManualConfirmProperty,
    EditableMeasureProperty,
    EditableMeasureTemplateValues,
    EditableResponseProperty,
    emptyPropertyDefaults,
    MeasureTemplateValues,
    preprocessProperty,
} from './measure-template-form-utils';
import { AlarmPropertyEditorComponent } from './alarm-property-editor/alarm-property-editor.component';

@Component({
    selector: 'app-measure-template-form',
    templateUrl: './measure-template-form.component.html',
    styleUrl: './measure-template-form.component.scss',
    imports: [
        FormsModule,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem,
        DisplayModelValidationComponent,
        FormField,
        AlarmPropertyEditorComponent,
        CdkDrag,
        CdkDropList,
        CdkDragHandle,
        CdkDragPlaceholder,
        CdkDragPreview,
        NgbTooltip,
    ],
})
export class MeasureTemplateFormComponent implements OnChanges {
    private readonly messageService = inject(MessageService);

    readonly initialValues = input.required<EditableMeasureTemplateValues>();
    readonly btnText = input.required<string>();

    /**
     * Emits the changed values
     */
    readonly submitMeasureTemplate = output<MeasureTemplateValues>();

    public readonly values = signal<EditableMeasureTemplateValues>({
        name: '',
        properties: [],
        categoryName: '',
        replacePrevious: false,
    });
    public readonly measureTemplateForm = form(this.values, (schemaPath) => {
        disabled(schemaPath.categoryName);
        validateStandardSchema(schemaPath, () =>
            measureTemplateSchema
                .omit({ id: true })
                .extend({ categoryName: z.string() })
        );
    });

    public readonly measurePropertyTypes = measurePropertyTypeSchema.values;

    public humanReadablePropertyName(property: MeasurePropertyType) {
        return measurePropertyTypeToGermanNameDictionary[property];
    }

    ngOnChanges(changes: SimpleChangesGeneric<this>): void {
        if (changes.initialValues.firstChange) {
            this.values.set({ ...this.initialValues() });
        }
    }

    public onDrop(event: CdkDragDrop<EditableMeasureProperty>) {
        this.values.update((v) => {
            const properties = [...v.properties];
            moveItemInArray(
                properties,
                event.previousIndex,
                event.currentIndex
            );
            return { ...v, properties };
        });
    }

    public async onSubmit() {
        const valuesOnSubmit = cloneDeep(this.values());
        try {
            this.submitMeasureTemplate.emit({
                name: valuesOnSubmit.name,
                properties: valuesOnSubmit.properties.map((p) =>
                    this.parseProperty(p)
                ),
                categoryName: valuesOnSubmit.categoryName,
                replacePrevious: valuesOnSubmit.replacePrevious,
            });
        } catch (e: unknown) {
            if (!(e instanceof ZodError)) throw e;
            this.messageService.postError({
                title: 'Ungültige Schritte',
                body: e.message,
            });
        }
    }

    public addProperty(propertyType: MeasurePropertyType) {
        this.values.update((v) => ({
            ...v,
            properties: [
                ...v.properties,
                cloneDeep(emptyPropertyDefaults[propertyType]),
            ],
        }));
    }

    public removeProperty(index: number) {
        this.values.update((v) => ({
            ...v,
            properties: v.properties.filter((_, i) => i !== index),
        }));
    }

    private parseProperty(property: EditableMeasureProperty): MeasureProperty {
        return measurePropertySchema.parse(preprocessProperty(property));
    }

    // Type helpers
    private createPropertyCastFunction<T extends EditableMeasureProperty>() {
        return (property: FieldTree<EditableMeasureProperty>): FieldTree<T> =>
            property as FieldTree<T>;
    }

    public asManualConfirmProperty =
        this.createPropertyCastFunction<EditableManualConfirmProperty>();

    public asResponseProperty =
        this.createPropertyCastFunction<EditableResponseProperty>();

    public asDelayProperty =
        this.createPropertyCastFunction<EditableDelayProperty>();

    public asAlarmProperty =
        this.createPropertyCastFunction<EditableAlarmProperty>();

    public asEocLogProperty =
        this.createPropertyCastFunction<EditableEocLogProperty>();

    public asDrawFreehandProperty =
        this.createPropertyCastFunction<EditableDrawFreehandProperty>();

    public asDrawLineProperty =
        this.createPropertyCastFunction<EditableDrawLineProperty>();

    public updateAlarmGroups(index: number, alarmGroups: string[]) {
        this.values.update((v) => {
            if (v.properties[index] === undefined) return v;
            if (v.properties[index].type !== 'alarm') return v;
            v.properties[index].alarmGroups = alarmGroups;
            return v;
        });
    }

    public updateTargetTransferPoints(
        index: number,
        targetTransferPoints: string[]
    ) {
        this.values.update((v) => {
            if (v.properties[index] === undefined) return v;
            if (v.properties[index].type !== 'alarm') return v;
            v.properties[index].targetTransferPointIds = targetTransferPoints;
            return v;
        });
    }
}
