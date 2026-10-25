import {
    Component,
    computed,
    inject,
    output,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { WritableDraft } from 'immer';
import type { MeasureTemplate, UUID } from 'fuesim-digital-shared';
import { cloneDeepMutable, uuid } from 'fuesim-digital-shared';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
    selectAlarmGroups,
    selectAlarmgroupTemplates,
    selectCategorizedMeasureTemplates,
} from '../../../../../state/application/selectors/exercise.selectors';
import type { AppState } from '../../../../../state/app.state';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';
import {
    openCreateMeasureTemplateModal,
    openEditMeasureTemplateModal,
} from '../editor-panel/measure-template-modal/open-measure-template-modal';
import { ConfirmationModalService } from '../../../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../../../core/exercise.service';
import { MeasureCardComponent } from '../editor-panel/measure-card/measure-card.component';
import { AppSaveOnTypingDirective } from '../../../../../shared/directives/app-save-on-typing.directive';
import { HelpButtonComponent } from '../../../../../help-button/help-button.component';
import { MessageService } from '../../../../../core/messages/message.service';
import type { MeasureTemplateDragData } from './measure-template-drag-data';
import { isMeasureTemplateDragData } from './measure-template-drag-data';

@Component({
    selector: 'app-measure-template-overview-page',
    templateUrl: './measure-template-overview-page.component.html',
    styleUrls: ['./measure-template-overview-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        MeasureCardComponent,
        CdkDropList,
        CdkDrag,
        FormsModule,
        AppSaveOnTypingDirective,
        HelpButtonComponent,
    ],
})
export class MeasureTemplateOverviewPageComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);

    public readonly closeView = output();

    public readonly categorizedMeasureTemplates = this.store.selectSignal(
        selectCategorizedMeasureTemplates
    );

    public readonly categories = computed(() =>
        Object.entries(this.categorizedMeasureTemplates())
            .map(([name, category]) => ({
                name,
                templates: Object.values(category.templates),
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
    );

    public addCategory(): void {
        const base = 'Neue Kategorie';
        const existingNames = new Set(
            Object.keys(this.categorizedMeasureTemplates())
        );
        let name = base;
        let suffix = 2;
        while (existingNames.has(name)) {
            name = `${base} ${suffix++}`;
        }
        this.exerciseService.proposeAction({
            type: '[MeasureTemplateCategory] Add MeasureTemplateCategory',
            name,
        });
    }

    public renameCategory(previousName: string, newName: string): void {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === previousName) return;
        if (this.categorizedMeasureTemplates()[trimmed]) {
            this.messageService.postError({
                title: 'Kategorie existiert bereits',
                body: `Eine Kategorie mit dem Namen "${trimmed}" existiert bereits.`,
            });
            return;
        }
        this.exerciseService.proposeAction({
            type: '[MeasureTemplateCategory] Rename MeasureTemplateCategory',
            previousName,
            newName: trimmed,
        });
    }

    public async deleteCategory(name: string): Promise<void> {
        const category = this.categorizedMeasureTemplates()[name];
        if (category && Object.keys(category.templates).length > 0) {
            const confirmDelete = await this.confirmationModalService.confirm({
                title: 'Kategorie löschen',
                description: `Möchten Sie die Kategorie "${name}" wirklich löschen? Enthaltene Maßnahmen werden ebenfalls gelöscht.`,
            });
            if (!confirmDelete) return;
        }
        this.exerciseService.proposeAction({
            type: '[MeasureTemplateCategory] Remove MeasureTemplateCategory',
            name,
        });
    }

    public addMeasureTemplate(categoryName: string) {
        openCreateMeasureTemplateModal(this.ngbModalService, categoryName);
    }

    public editMeasureTemplate(categoryName: string, measureTemplateId: UUID) {
        openEditMeasureTemplateModal(
            this.ngbModalService,
            categoryName,
            measureTemplateId
        );
    }

    public async deleteMeasureTemplate(
        categoryName: string,
        measureTemplateId: UUID
    ): Promise<void> {
        const measureTemplate =
            this.categorizedMeasureTemplates()[categoryName]?.templates[
                measureTemplateId
            ];
        const confirmDelete = await this.confirmationModalService.confirm({
            title: 'Maßnahme löschen',
            description: `Möchten Sie die Maßnahme "${measureTemplate?.name}" wirklich löschen?`,
        });
        if (!confirmDelete) {
            return;
        }
        this.exerciseService.proposeAction({
            type: '[MeasureTemplate] Remove MeasureTemplate',
            id: measureTemplateId,
        });
    }

    public onlyMeasureTemplateDropPredicate(event: CdkDrag) {
        return isMeasureTemplateDragData(event.data);
    }

    public async dropTemplate(
        event: CdkDragDrop<MeasureTemplateDragData>,
        targetCategoryName: string
    ) {
        if (event.previousContainer === event.container) return;
        const data = event.item.data;
        switch (data.source) {
            case 'blueprint': {
                const measureTemplate = cloneDeepMutable(data.template);
                measureTemplate.id = uuid();
                await this.linkAlarmGroupsToExercise(measureTemplate);
                this.exerciseService.proposeAction({
                    type: '[MeasureTemplate] Add MeasureTemplate',
                    categoryName: targetCategoryName,
                    measureTemplate,
                });
                return;
            }
            case 'categorized': {
                if (data.categoryName === targetCategoryName) return;
                this.exerciseService.proposeAction({
                    type: '[MeasureTemplate] Change Category of MeasureTemplate',
                    id: data.template.id,
                    categoryName: targetCategoryName,
                });
            }
        }
    }

    /**
     * Templates from the marketplace reference alarm group templates (by their version id),
     * while measures in the exercise reference the alarm groups of the exercise.
     * This replaces each reference with the alarm groups of the exercise created from that template,
     * adding the alarm group to the exercise first if it is not yet part of it.
     */
    private async linkAlarmGroupsToExercise(
        measureTemplate: WritableDraft<MeasureTemplate>
    ) {
        const resolve = async (ref: string): Promise<UUID[]> => {
            const alarmGroups = selectStateSnapshot(
                selectAlarmGroups,
                this.store
            );
            if (alarmGroups[ref]) return [ref];
            const linked = Object.values(alarmGroups)
                .filter((alarmGroup) => alarmGroup.entity?.versionId === ref)
                .map((alarmGroup) => alarmGroup.id);
            if (linked.length > 0) return linked;
            const alarmGroupTemplate = selectStateSnapshot(
                selectAlarmgroupTemplates,
                this.store
            )[ref];
            if (!alarmGroupTemplate) return [];
            const id = uuid();
            const response = await this.exerciseService.proposeAction({
                type: '[AlarmGroup] Add AlarmGroup',
                alarmGroup: { ...cloneDeepMutable(alarmGroupTemplate), id },
            });
            return response.success ? [id] : [];
        };

        const alarmProperties = measureTemplate.properties.filter(
            (property) => property.type === 'alarm'
        );
        const refs = [
            ...new Set(
                alarmProperties.flatMap((property) => property.alarmGroups)
            ),
        ];
        const exerciseAlarmGroupIdsByRef = new Map(
            await Promise.all(
                refs.map(async (ref) => [ref, await resolve(ref)] as const)
            )
        );
        for (const property of alarmProperties) {
            property.alarmGroups = [
                ...new Set(
                    property.alarmGroups.flatMap(
                        (ref) => exerciseAlarmGroupIdsByRef.get(ref)!
                    )
                ),
            ];
        }
        const unresolvedCount = refs.filter(
            (ref) => exerciseAlarmGroupIdsByRef.get(ref)!.length === 0
        ).length;
        if (unresolvedCount > 0) {
            this.messageService.postMessage({
                title: 'Alarmgruppen nicht gefunden',
                body: `${unresolvedCount} Alarmgruppe(n) der Maßnahme "${measureTemplate.name}" sind in dieser Übung nicht verfügbar und wurden entfernt. Bitte prüfen Sie die Alarmierungs-Schritte der Maßnahme.`,
                color: 'warning',
            });
        }
    }

    public dragDataFor(
        categoryName: string,
        template: MeasureTemplate
    ): MeasureTemplateDragData {
        return { source: 'categorized', categoryName, template };
    }
}
