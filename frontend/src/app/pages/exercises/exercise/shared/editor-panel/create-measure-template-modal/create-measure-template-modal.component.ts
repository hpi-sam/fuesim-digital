import {
    AfterViewInit,
    Component,
    ElementRef,
    inject,
    Injector,
    OnDestroy,
} from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { uuid } from 'fuesim-digital-shared';
import { MeasureTemplateFormComponent } from '../measure-template-form/measure-template-form.component';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    EditableMeasureTemplateValues,
    MeasureTemplateValues,
} from '../measure-template-form/measure-template-form-utils';

@Component({
    selector: 'app-create-measure-template-modal',
    imports: [MeasureTemplateFormComponent],
    templateUrl: './create-measure-template-modal.component.html',
    styleUrl: './create-measure-template-modal.component.scss',
})
export class CreateMeasureTemplateModalComponent
    implements AfterViewInit, OnDestroy
{
    private readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);
    private readonly elementRef = inject(ElementRef);
    private readonly injector = inject(Injector);

    private modalScrollable?: CdkScrollable;

    public readonly editableMeasureTemplateValues: EditableMeasureTemplateValues =
        {
            name: '',
            properties: [],
        };

    ngAfterViewInit() {
        // ngb-modal-window is the actual overflow-scrolling element — it sits
        // above modal-dialog > modal-content > our host in the DOM tree.
        // To auto-scroll when dragging, we need to add CdkScrollable to it.
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

    public createMeasureTemplate({ name, properties }: MeasureTemplateValues) {
        this.exerciseService
            .proposeAction({
                type: '[MeasureTemplate] Add measureTemplate',
                measureTemplate: {
                    id: uuid(),
                    name,
                    properties,
                },
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
