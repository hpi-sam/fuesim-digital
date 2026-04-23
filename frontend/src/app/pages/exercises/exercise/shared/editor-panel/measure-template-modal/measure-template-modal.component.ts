import {
    AfterViewInit,
    Component,
    computed,
    ElementRef,
    inject,
    Injector,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type {
    AddMeasureTemplateAction,
    EditMeasureTemplateAction,
    UUID,
} from 'fuesim-digital-shared';
import { cloneDeepMutable, newMeasureTemplate } from 'fuesim-digital-shared';
import { MeasureTemplateFormComponent } from '../measure-template-form/measure-template-form.component';
import { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    createSelectMeasureTemplate,
    selectMeasureTemplateCategories,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import type { MeasureTemplateValues } from '../measure-template-form/measure-template-form-utils';

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

    public measureTemplateValues?: MeasureTemplateValues;

    public categoryName?: string;
    public readonly categories = this.store.selectSignal(
        selectMeasureTemplateCategories
    );
    public readonly categoryNames = computed(() =>
        Object.values(this.categories()).map((v) => v.name)
    );

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

            const currentCategory = Object.values(this.categories()).find(
                (c) => c.templates[this.measureTemplateId!] !== undefined
            );
            this.measureTemplateValues = {
                name: measureTemplate.name,
                properties: measureTemplate.properties,
                categoryName: currentCategory?.name ?? '',
                replacePrevious: measureTemplate.replacePrevious,
            };
        } else {
            this.measureTemplateValues = {
                name: '',
                properties: [],
                categoryName: this.categoryName ?? '',
                replacePrevious: false,
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

    public submitMeasureTemplate({
        name,
        properties,
        categoryName,
        replacePrevious,
    }: MeasureTemplateValues) {
        const action: AddMeasureTemplateAction | EditMeasureTemplateAction =
            this.isEditMode
                ? {
                      type: '[MeasureTemplate] Edit measureTemplate',
                      id: this.measureTemplateId!,
                      name,
                      properties,
                      replacePrevious,
                  }
                : {
                      type: '[MeasureTemplate] Add measureTemplate',
                      measureTemplate: newMeasureTemplate(
                          name,
                          properties,
                          replacePrevious
                      ),
                      categoryName,
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
            description: `Möchten Sie die Maßnahme "${this.measureTemplateValues?.name}" wirklich löschen?`,
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
