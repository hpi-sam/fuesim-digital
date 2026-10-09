import {
    Component,
    computed,
    inject,
    output,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { MeasureTemplate, UUID } from 'fuesim-digital-shared';
import { uuid } from 'fuesim-digital-shared';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { selectCategorizedMeasureTemplates } from '../../../../../state/application/selectors/exercise.selectors';
import type { AppState } from '../../../../../state/app.state';
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
            type: '[MeasureTemplateCategory] Add Category',
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
            type: '[MeasureTemplateCategory] Rename Category',
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
            type: '[MeasureTemplateCategory] Delete Category',
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
            type: '[MeasureTemplateCategory] Remove Categorized Template',
            categoryName,
            id: measureTemplateId,
        });
    }

    public onlyMeasureTemplateDropPredicate(event: CdkDrag) {
        return isMeasureTemplateDragData(event.data);
    }

    public dropTemplate(
        event: CdkDragDrop<MeasureTemplateDragData>,
        targetCategoryName: string
    ) {
        if (event.previousContainer === event.container) return;
        const data = event.item.data;
        switch (data.source) {
            case 'blueprint': {
                this.exerciseService.proposeAction({
                    type: '[MeasureTemplateCategory] Add Template To Category',
                    categoryName: targetCategoryName,
                    measureTemplate: { ...data.template, id: uuid() },
                });
                return;
            }
            case 'categorized': {
                if (data.categoryName === targetCategoryName) return;
                this.exerciseService.proposeAction({
                    type: '[MeasureTemplateCategory] Move Template To Category',
                    id: data.template.id,
                    previousCategoryName: data.categoryName,
                    newCategoryName: targetCategoryName,
                });
            }
        }
    }

    public dragDataFor(
        categoryName: string,
        template: MeasureTemplate
    ): MeasureTemplateDragData {
        return { source: 'categorized', categoryName, template };
    }
}
