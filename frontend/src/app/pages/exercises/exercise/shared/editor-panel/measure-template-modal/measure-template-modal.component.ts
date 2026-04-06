import {
    AfterViewInit,
    Component,
    ElementRef,
    inject,
    Injector,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { MeasureProperty, UUID } from 'fuesim-digital-shared';
import { cloneDeepMutable, uuid } from 'fuesim-digital-shared';
import { MeasureTemplateFormComponent } from '../measure-template-form/measure-template-form.component';
import { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { createSelectMeasureTemplate } from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import type {
    EditableMeasureTemplateValues,
    MeasureTemplateValues,
} from '../measure-template-form/measure-template-form-utils';

@Component({
    selector: 'app-measure-template-modal',
    imports: [MeasureTemplateFormComponent],
    templateUrl: './measure-template-modal.component.html',
    styleUrl: './measure-template-modal.component.scss',
})
export class MeasureTemplateModalComponent
    implements OnInit, AfterViewInit, OnDestroy
{
    private readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly elementRef = inject(ElementRef);
    private readonly injector = inject(Injector);

    private modalScrollable?: CdkScrollable;

    /**
     * Set after modal creation for edit mode. When undefined, the modal
     * operates in create mode.
     */
    public measureTemplateId?: UUID;

    public editableMeasureTemplateValues?: EditableMeasureTemplateValues;

    get isEditMode(): boolean {
        return this.measureTemplateId !== undefined;
    }

    ngOnInit(): void {
        if (this.measureTemplateId) {
            const measureTemplate = cloneDeepMutable(
                selectStateSnapshot(
                    createSelectMeasureTemplate(this.measureTemplateId),
                    this.store
                )
            );

            this.editableMeasureTemplateValues = {
                name: measureTemplate.name,
                properties: measureTemplate.properties.map(toEditableProperty),
            };
        } else {
            this.editableMeasureTemplateValues = {
                name: '',
                properties: [],
            };
        }
    }

    ngAfterViewInit() {
        let el: HTMLElement | null = this.elementRef.nativeElement;
        while (el && el.tagName.toLowerCase() !== 'ngb-modal-window') {
            el = el.parentElement;
        }

        if (!el) return;

        const childInjector = Injector.create({
            parent: this.injector,
            providers: [
                { provide: ElementRef, useValue: new ElementRef(el) },
                { provide: CdkScrollable },
            ],
        });

        this.modalScrollable = childInjector.get(CdkScrollable);
        // eslint-disable-next-line @angular-eslint/no-lifecycle-call
        this.modalScrollable.ngOnInit();
    }

    ngOnDestroy() {
        // eslint-disable-next-line @angular-eslint/no-lifecycle-call
        this.modalScrollable?.ngOnDestroy();
    }

    public submitMeasureTemplate({ name, properties }: MeasureTemplateValues) {
        const action = this.isEditMode
            ? {
                  type: '[MeasureTemplate] Edit measureTemplate' as const,
                  id: this.measureTemplateId!,
                  name,
                  properties,
              }
            : {
                  type: '[MeasureTemplate] Add measureTemplate' as const,
                  measureTemplate: {
                      id: uuid(),
                      name,
                      properties,
                  },
              };

        this.exerciseService.proposeAction(action).then((response) => {
            if (response.success) {
                this.close();
            }
        });
    }

    public async deleteMeasureTemplate(): Promise<void> {
        const confirmDelete = await this.confirmationModalService.confirm({
            title: 'Maßnahme löschen',
            description: `Möchten Sie die Maßnahme "${this.editableMeasureTemplateValues?.name}" wirklich löschen?`,
        });
        if (!confirmDelete) {
            return;
        }
        this.exerciseService
            .proposeAction({
                type: '[MeasureTemplate] Delete measureTemplate',
                id: this.measureTemplateId!,
            })
            .then((response) => {
                if (response.success) {
                    this.close();
                }
            });
    }

    public close() {
        this.activeModal.close();
    }
}

function toEditableProperty(property: MeasureProperty) {
    switch (property.type) {
        case 'manualConfirm':
            return {
                ...property,
                confirmationString: property.confirmationString ?? '',
            };
        case 'eocLog':
            return {
                ...property,
                message: property.message ?? '',
            };
        default:
            return { ...property };
    }
}
