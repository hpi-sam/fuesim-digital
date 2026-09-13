import {
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    disabled,
    form,
    FormField,
    FieldTree,
    validateStandardSchema,
} from '@angular/forms/signals';
import {
    cloneDeepMutable,
    defaultMeasureTemplateCategory,
    measurePropertyTypeSchema,
    measurePropertyTypeToGermanNameDictionary,
    measureTemplateSchema,
    stripEntityFromElementSchema,
    uuid,
    type AlarmGroup,
    type MeasureProperty,
    type MeasurePropertyType,
    type MeasureTemplate,
    type TypedTemplateVersion,
} from 'fuesim-digital-shared';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import {
    BaseVersionedElementSubmodal,
    FormOutputInjectionToken,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';
import { HelpButtonComponent } from '../../../../../../../help-button/help-button.component';
import { MarketplaceFormSubmitButtonBarComponent } from '../../submit-button-bar/submit-button-bar.component';

@Component({
    selector: 'app-measure-template-form-marketplace',
    templateUrl: './measure-template-form.component.html',
    styleUrl: './measure-template-form.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        FormField,
        DisplayModelValidationComponent,
        HelpButtonComponent,
        MarketplaceFormSubmitButtonBarComponent,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem,
        NgbTooltip,
    ],
})
export class MeasureTemplateFormMarketplaceComponent implements BaseVersionedElementSubmodal<MeasureTemplate> {
    public readonly data =
        input.required<VersionedElementModalData<MeasureTemplate>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);

    public readonly formOutput = inject(FormOutputInjectionToken);

    public readonly values = signal<MeasureTemplate>({
        type: 'measureTemplate',
        id: uuid(),
        name: '',
        category: defaultMeasureTemplateCategory,
        properties: [],
        replacePrevious: false,
    });

    public readonly measureTemplateForm = form(this.values, (schema) => {
        disabled(schema, { when: () => this.disabled() });
        validateStandardSchema(schema, () =>
            stripEntityFromElementSchema(measureTemplateSchema)
        );
    });

    public readonly measurePropertyTypes = measurePropertyTypeSchema.values;

    public readonly availableAlarmGroups = computed(() => {
        const elements = this.data().availableCollectionElements;
        return elements.filter(
            (v) => v.content.type === 'alarmGroup'
        ) as TypedTemplateVersion<AlarmGroup>[];
    });

    public readonly availableCategories = computed(() => {
        const elements = this.data().availableCollectionElements;
        const measureTemplates = elements.filter(
            (v) => v.content.type === 'measureTemplate'
        ) as TypedTemplateVersion<MeasureTemplate>[];
        const categories = measureTemplates.map((v) => v.content.category);
        return [...new Set(categories)].sort((a, b) => a.localeCompare(b));
    });

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.mode !== 'create') {
                const content = cloneDeepMutable(data.element.content);
                this.values.set({
                    ...content,
                    properties: content.properties.map((p) => {
                        switch (p.type) {
                            case 'manualConfirm':
                                return {
                                    ...p,
                                    confirmationString:
                                        p.confirmationString ?? '',
                                };
                            case 'eocLog':
                                return { ...p, message: p.message ?? '' };
                            default:
                                return p;
                        }
                    }),
                });
            }
        });
    }

    public humanReadablePropertyName(property: MeasurePropertyType) {
        return measurePropertyTypeToGermanNameDictionary[property];
    }

    public propertyHelpUrl(property: MeasurePropertyType) {
        return `2_exercises/3_exercise_elements.html#${this.propertyHelpAnchor(property)}`;
    }

    private propertyHelpAnchor(property: MeasurePropertyType) {
        switch (property) {
            case 'manualConfirm':
                return 'manuelle-bestätigung';
            case 'response':
                return 'rückmeldung';
            case 'delay':
                return 'verzögerung';
            case 'alarm':
                return 'alarmierung';
            case 'eocLog':
                return 'einsatztagebucheintrag';
            case 'drawFreehand':
                return 'freihandzeichnung';
            case 'drawLine':
                return 'linienzeichnung';
        }
    }

    public selectCategory(category: string) {
        this.values.update((v) => ({ ...v, category }));
    }

    public moveUp(index: number) {
        if (index <= 0) return;
        this.values.update((v) => {
            const properties = [...v.properties];
            [properties[index - 1], properties[index]] = [
                properties[index]!,
                properties[index - 1]!,
            ];
            return { ...v, properties };
        });
    }

    public moveDown(index: number) {
        this.values.update((v) => {
            if (index < 0 || index >= v.properties.length - 1) return v;
            const properties = [...v.properties];
            [properties[index], properties[index + 1]] = [
                properties[index + 1]!,
                properties[index]!,
            ];
            return { ...v, properties };
        });
    }

    public addProperty(propertyType: MeasurePropertyType) {
        this.values.update((v) => ({
            ...v,
            properties: [
                ...v.properties,
                cloneDeepMutable(emptyPropertyDefaults[propertyType]),
            ],
        }));
    }

    public removeProperty(index: number) {
        this.values.update((v) => ({
            ...v,
            properties: v.properties.filter((_, i) => i !== index),
        }));
    }

    public narrowProperty<T extends MeasurePropertyType>(
        property: FieldTree<MeasureProperty>,
        _type: T
    ) {
        return property as unknown as FieldTree<
            Extract<MeasureProperty, { type: T }>
        >;
    }

    public addAlarmGroup(index: number, alarmGroupVersionId: string) {
        this.values.update((v) => {
            const property = v.properties[index];
            if (property?.type !== 'alarm') return v;
            const properties = [...v.properties];
            properties[index] = {
                ...property,
                alarmGroups: [...property.alarmGroups, alarmGroupVersionId],
            };
            return { ...v, properties };
        });
    }

    public removeAlarmGroup(index: number, alarmGroupVersionId: string) {
        this.values.update((v) => {
            const property = v.properties[index];
            if (property?.type !== 'alarm') return v;
            const properties = [...v.properties];
            properties[index] = {
                ...property,
                alarmGroups: property.alarmGroups.filter(
                    (id) => id !== alarmGroupVersionId
                ),
            };
            return { ...v, properties };
        });
    }

    public getAlarmGroupById(id: string) {
        return this.availableAlarmGroups().find((ag) => ag.versionId === id)
            ?.content;
    }

    public submitData() {
        const valuesOnSubmit = cloneDeepMutable(
            this.measureTemplateForm().value()
        );
        this.formOutput.dataSubmit(valuesOnSubmit);
    }
}

const emptyPropertyDefaults: {
    [Key in MeasurePropertyType]: Extract<MeasureProperty, { type: Key }>;
} = {
    manualConfirm: {
        type: 'manualConfirm',
        hint: '',
        prompt: '',
        confirmationString: '',
    },
    response: {
        type: 'response',
        hint: '',
        response: '',
    },
    delay: {
        type: 'delay',
        hint: 'Bitte warten Sie',
        delay: 60,
    },
    alarm: {
        type: 'alarm',
        hint: '',
        alarmGroups: [],
        targetTransferPointIds: [],
    },
    eocLog: {
        type: 'eocLog',
        hint: '',
        message: '',
        editable: true,
        confirm: true,
    },
    drawFreehand: {
        type: 'drawFreehand',
        hint: 'Jetzt frei Bereich einzeichnen (gedrückt halten)',
        strokeColor: '#000000',
        fillColor: '#ff0000',
    },
    drawLine: {
        type: 'drawLine',
        hint: 'Jetzt eine Linie einzeichnen (einfacher Klick um neuen Punkt zu setzen, doppelter Klick für Schlusspunkt)',
        strokeColor: '#000000',
    },
};
