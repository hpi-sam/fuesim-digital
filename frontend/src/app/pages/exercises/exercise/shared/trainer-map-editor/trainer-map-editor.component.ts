import {
    OnInit,
    inject,
    Component,
    computed,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    NgbModal,
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionButton,
    NgbAccordionCollapse,
    NgbAccordionBody,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    migratePartialExport,
    transferPointImage,
    validateExerciseExport,
    viewportImage,
    bystanderCategories,
    scoutableMapImageTemplate,
    getEntityFromElement,
} from 'fuesim-digital-shared';
import type {
    PatientCategory,
    UUID,
    TechnicalChallengeTemplate,
    Element as FuesimElement,
    CollectionEntityId,
    CollectionVersionId,
} from 'fuesim-digital-shared';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import {
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import {
    DragElementService,
    TransferTemplate,
} from '../core/drag-element.service';
import { TransferLinesService } from '../core/transfer-lines.service';
import { openCreateImageTemplateModal } from '../editor-panel/create-image-template-modal/open-create-image-template-modal';
import { openEditImageTemplateModal } from '../editor-panel/edit-image-template-modal/open-edit-image-template-modal';
import { openPartialImportOverwriteModal } from '../partial-import/open-partial-import-overwrite-modal';
import { simulatedRegionDragTemplates } from '../editor-panel/templates/simulated-region';
import { restrictedZoneDragTemplates } from '../editor-panel/templates/restricted-zone';
import { MessageService } from '../../../../../core/messages/message.service';
import type { AppState } from '../../../../../state/app.state';
import {
    selectPatientCategories,
    selectVehicleTemplates,
    selectMapImagesTemplates,
    selectExerciseState,
    selectAlarmgroupTemplates,
    selectSelectedCollections,
    selectTechnicalChallengeTemplates,
} from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';
import { ExerciseMapComponent } from '../exercise-map/exercise-map.component';
import { FileInputDirective } from '../../../../../shared/directives/file-input.directive';
import { PatientStatusBadgeComponent } from '../../../../../shared/components/patient-status-badge/patient-status-badge.component';
import { PatientStatusDisplayComponent } from '../../../../../shared/components/patient-status-displayl/patient-status-display/patient-status-display.component';
import { TrainerToolbarComponent } from '../trainer-toolbar/trainer-toolbar.component';
import { ValuesPipe } from '../../../../../shared/pipes/values.pipe';
import { HelpBannerComponent } from '../../../../../help-banner/help-banner.component.js';
import { MapEditorCardComponent } from '../../../../../shared/components/map-editor-card/map-editor-card.component';
import { AlarmGroupOverviewPageComponent } from '../alarm-group-page/alarm-group-overview-page.component';
import { HospitalEditorPageComponent } from '../hospital-editor-page/hospital-editor-page.component';
import { openManageExerciseCollectionsModal } from '../manage-exercise-collections/open-manage-exercise-collections-modal';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { openEditTechnicalChallengeTemplateModal } from '../editor-panel/edit-technical-challenge-template-modal/open-edit-technical-challenge-template-modal.js';

const categories = ['green', 'yellow', 'red'] as const;
const colorCodeOfCategories = {
    green: 'X',
    yellow: 'Y',
    red: 'Z',
} as const;

type FilterCategory =
    (typeof colorCodeOfCategories)[(typeof categories)[number]];

@Component({
    selector: 'app-trainer-map-editor',
    templateUrl: './trainer-map-editor.component.html',
    styleUrls: ['./trainer-map-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        ExerciseMapComponent,
        FileInputDirective,
        NgbAccordionDirective,
        NgbAccordionItem,
        NgbAccordionHeader,
        NgbAccordionButton,
        NgbAccordionCollapse,
        NgbAccordionBody,
        MapEditorCardComponent,
        FormsModule,
        PatientStatusBadgeComponent,
        NgbTooltip,
        PatientStatusDisplayComponent,
        TrainerToolbarComponent,
        AsyncPipe,
        KeyValuePipe,
        ValuesPipe,
        HelpBannerComponent,
        CdkDrag,
        CdkDropList,
        CdkDropListGroup,
        NgTemplateOutlet,
        CdkDragPlaceholder,
        AlarmGroupOverviewPageComponent,
        HospitalEditorPageComponent,
    ],
})
/**
 * A wrapper around the map that provides trainers with more options and tools.
 */
export class TrainerMapEditorComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly dragElementService = inject(DragElementService);
    readonly transferLinesService = inject(TransferLinesService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly messageService = inject(MessageService);
    private readonly collectionService = inject(CollectionService);

    public readonly overwriteTrainerMap = signal<
        'alarmgroups' | 'hospitals' | null
    >(null);

    public selectedCategories$: BehaviorSubject<{
        [key in FilterCategory]: boolean;
    }> = new BehaviorSubject<{ [key in FilterCategory]: boolean }>({
        X: true,
        Y: true,
        Z: true,
    });

    public get categories() {
        return categories;
    }
    public get colorCodeOfCategories() {
        return colorCodeOfCategories;
    }

    private readonly allPatientCategories$ = this.store.select(
        selectPatientCategories
    );
    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );

    public readonly mapImageTemplates$ = this.store.select(
        selectMapImagesTemplates
    );

    public readonly alarmGroupTemplates$ = this.store.select(
        selectAlarmgroupTemplates
    );

    public readonly selectedCollections$ = this.store.selectSignal(
        selectSelectedCollections
    );

    public readonly technicalChallengeTemplates = computed<
        readonly TechnicalChallengeTemplate[]
    >(() => {
        const templates = this.store.selectSignal(
            selectTechnicalChallengeTemplates
        );
        return Object.values(templates());
    });

    public patientCategories$?: Observable<{
        [key in FilterCategory]?: PatientCategory[];
    }>;

    public bystanderCategories = bystanderCategories;
    public scoutableMapImageTemplate = scoutableMapImageTemplate;

    ngOnInit() {
        this.patientCategories$ = combineLatest([
            this.allPatientCategories$,
            this.selectedCategories$,
        ]).pipe(
            map(([patientCategories, selectedCategories]) => {
                const filteredCategories: {
                    [key in FilterCategory]?: PatientCategory[];
                } = {};
                for (const category of Object.keys(
                    selectedCategories
                ) as FilterCategory[]) {
                    if (!selectedCategories[category]) continue;
                    filteredCategories[category] = patientCategories.filter(
                        (patientCategory) =>
                            category ===
                            (patientCategory.name.firstField
                                .colorCode as FilterCategory)
                    );
                }
                return filteredCategories;
            })
        );
    }

    public changeDisplayTransferLines(newValue: boolean) {
        this.transferLinesService.displayTransferLines = newValue;
    }

    public readonly simulatedRegionDragTemplates = simulatedRegionDragTemplates;

    public readonly restrictedZoneDragTemplates = restrictedZoneDragTemplates;

    public readonly viewportTemplate = {
        image: viewportImage,
    };

    public readonly transferPointTemplate = {
        image: transferPointImage,
    };

    public addImageTemplate() {
        openCreateImageTemplateModal(this.ngbModalService);
    }

    public editMapImageTemplate(mapImageTemplateId: UUID) {
        openEditImageTemplateModal(this.ngbModalService, mapImageTemplateId);
    }

    public editTechnicalChallengeTemplate(technicalChallengeTemplateId: UUID) {
        openEditTechnicalChallengeTemplateModal(
            this.ngbModalService,
            technicalChallengeTemplateId
        );
    }

    public setCurrentCategory(
        category: (typeof this.categories)[number],
        status: boolean
    ) {
        this.selectedCategories$.next({
            ...this.selectedCategories$.value,
            [this.colorCodeOfCategories[category]]: status,
        });
    }

    public startElementDrag(
        event: PointerEvent,
        transferTemplate: TransferTemplate
    ) {
        this.overwriteTrainerMap.set(null);
        this.dragElementService.onMouseDown(event, transferTemplate);
    }

    public openTemplateManagementModal() {
        openManageExerciseCollectionsModal(this.ngbModalService);
    }

    public getTitleOfCollectionVersion(collectionVersion: CollectionVersionId) {
        return this.collectionService.getCollectionVersionStructureFromCache(
            collectionVersion
        ).title;
    }

    public filterElementsToCollection(
        elements: FuesimElement[],
        collectionEntityId: CollectionEntityId
    ) {
        return elements.filter((element) =>
            this.getCollectionsOfElement(element).includes(collectionEntityId)
        );
    }

    public getCollectionsOfElement(
        element: FuesimElement
    ): CollectionEntityId[] {
        const entity = getEntityFromElement(element);

        if (entity === undefined) {
            return [];
        }

        const collectionElements = this.selectedCollections$().map(
            (collection) => ({
                collection,
                elements:
                    this.collectionService.getCollectionVersionStructureFromCache(
                        collection.versionId
                    ),
            })
        );

        return collectionElements
            .filter(
                (collection) =>
                    collection.elements.direct.some(
                        (directElement) =>
                            directElement.versionId === entity.versionId
                    ) ||
                    collection.elements.imported.some((importItem) =>
                        importItem.elements.some(
                            (importedElement) =>
                                importedElement.versionId === entity.versionId
                        )
                    )
            )
            .map((collection) => collection.collection.entityId);
    }

    public getElementsWithoutCollection(
        elements: FuesimElement[]
    ): FuesimElement[] {
        return elements.filter(
            (element) => getEntityFromElement(element) === undefined
        );
    }

    public getEntityOfElement(element: FuesimElement) {
        return getEntityFromElement(element);
    }

    public importingTemplates = false;
    public async importPartialExport(fileList: FileList) {
        try {
            this.importingTemplates = true;
            const importedText = await fileList.item(0)?.text();
            if (importedText === undefined) {
                // The file dialog has been aborted.
                return;
            }
            const importedPlainObject = JSON.parse(importedText);

            const partialExport = validateExerciseExport(importedPlainObject);
            if (partialExport.type !== 'partial') {
                this.messageService.postError({
                    title: 'An dieser Stelle können keine vollständigen Übungsexports importiert werden.',
                });
                return;
            }
            const migratedPartialExport = migratePartialExport(
                partialExport,
                selectStateSnapshot(selectExerciseState, this.store)
            );
            openPartialImportOverwriteModal(
                this.ngbModalService,
                migratedPartialExport
            );
        } catch {
            this.messageService.postError({
                title: 'Fehler beim Importieren von Vorlagen',
            });
        } finally {
            this.importingTemplates = false;
        }
    }
}
