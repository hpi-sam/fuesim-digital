import { Component, computed, inject } from '@angular/core';
import {
    NgbActiveModal,
    NgbModal,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import {
    CdkDrag,
    CdkDragDrop,
    CdkDropList,
    CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import {
    createSelectMeasureTemplate,
    selectMeasureTemplateCategories,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { AppState } from '../../../../../../state/app.state';
import {
    openCreateMeasureTemplateModal,
    openEditMeasureTemplateModal,
} from '../../editor-panel/measure-template-modal/open-measure-template-modal';
import { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { MeasureCardComponent } from '../../editor-panel/measure-card/measure-card.component';
import { MessageService } from '../../../../../../core/messages/message.service';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';

@Component({
    selector: 'app-measures-overview-modal',
    templateUrl: './measures-overview-modal.component.html',
    styleUrls: ['./measures-overview-modal.component.scss'],
    imports: [
        MeasureCardComponent,
        CdkDropList,
        CdkDrag,
        CdkDropListGroup,
        FormsModule,
        AppSaveOnTypingDirective,
        NgbTooltip,
    ],
})
export class MeasuresOverviewModalComponent {
    activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly ngbModalService = inject(NgbModal);
    private readonly messageService = inject(MessageService);

    public readonly categoriesMap = this.store.selectSignal(
        selectMeasureTemplateCategories
    );

    public readonly categories = computed(() =>
        Object.values(this.categoriesMap()).map((category) => ({
            name: category.name,
            templates: Object.values(category.templates),
        }))
    );

    public close() {
        this.activeModal.close();
    }

    public addCategory(): void {
        const base = 'Neue Kategorie';
        let name = base;
        let suffix = 2;
        while (this.categoriesMap()[name] !== undefined) {
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
        if (this.categoriesMap()[trimmed] !== undefined) {
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
        const confirmDelete = await this.confirmationModalService.confirm({
            title: 'Kategorie löschen',
            description: `Möchten Sie die Kategorie "${name}" wirklich löschen? Enthaltene Maßnahmen werden in eine andere Kategorie verschoben.`,
        });
        if (!confirmDelete) return;
        this.exerciseService.proposeAction({
            type: '[MeasureTemplateCategory] Remove MeasureTemplateCategory',
            name,
        });
    }

    public addMeasureTemplate(categoryName: string) {
        openCreateMeasureTemplateModal(this.ngbModalService, categoryName);
    }

    public editMeasureTemplate(measureTemplateId: UUID) {
        openEditMeasureTemplateModal(this.ngbModalService, measureTemplateId);
    }

    public async deleteMeasureTemplate(measureTemplateId: UUID): Promise<void> {
        const measure = selectStateSnapshot(
            createSelectMeasureTemplate(measureTemplateId),
            this.store
        );
        const confirmDelete = await this.confirmationModalService.confirm({
            title: 'Maßnahme löschen',
            description: `Möchten Sie die Maßnahme "${measure.name}" wirklich löschen?`,
        });
        if (!confirmDelete) {
            return;
        }
        this.exerciseService.proposeAction({
            type: '[MeasureTemplate] Remove MeasureTemplate',
            id: measureTemplateId,
        });
    }

    public dropTemplate(
        event: CdkDragDrop<{ categoryName: string }>,
        targetCategoryName: string
    ) {
        if (event.previousContainer === event.container) return;
        const templateId = event.item.data as UUID;
        this.exerciseService.proposeAction({
            type: '[MeasureTemplate] Change Category of MeasureTemplate',
            id: templateId,
            categoryName: targetCategoryName,
        });
    }
}
