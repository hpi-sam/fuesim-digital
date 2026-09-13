import {
    Component,
    computed,
    inject,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    NgbActiveModal,
    NgbModal,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { MeasureTemplate, UUID } from 'fuesim-digital-shared';
import {
    CdkDrag,
    CdkDragDrop,
    CdkDropList,
    CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import {
    createSelectMeasureTemplate,
    selectMeasureTemplates,
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
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component';

@Component({
    selector: 'app-measures-overview-modal',
    templateUrl: './measures-overview-modal.component.html',
    styleUrls: ['./measures-overview-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        MeasureCardComponent,
        CdkDropList,
        CdkDrag,
        CdkDropListGroup,
        FormsModule,
        AppSaveOnTypingDirective,
        NgbTooltip,
        HelpButtonComponent,
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

    public readonly measureTemplates = this.store.selectSignal(
        selectMeasureTemplates
    );

    /**
     * A category with no templates yet isn't persisted anywhere. This tracks new
     * categories so they stay visible before a template is added to them.
     */
    private readonly pendingEmptyCategoryNames = signal<string[]>([]);

    public readonly categories = computed(() => {
        const templatesByCategory = new Map<string, MeasureTemplate[]>();
        for (const template of Object.values(this.measureTemplates())) {
            const templates = templatesByCategory.get(template.category) ?? [];
            templates.push(template);
            templatesByCategory.set(template.category, templates);
        }
        for (const name of this.pendingEmptyCategoryNames()) {
            if (!templatesByCategory.has(name)) {
                templatesByCategory.set(name, []);
            }
        }
        return [...templatesByCategory.entries()]
            .map(([name, templates]) => ({ name, templates }))
            .sort((a, b) => a.name.localeCompare(b.name));
    });

    public close() {
        this.activeModal.close();
    }

    public addCategory(): void {
        const base = 'Neue Kategorie';
        const existingNames = new Set(this.categories().map((c) => c.name));
        let name = base;
        let suffix = 2;
        while (existingNames.has(name)) {
            name = `${base} ${suffix++}`;
        }
        this.pendingEmptyCategoryNames.update((names) => [...names, name]);
    }

    public renameCategory(previousName: string, newName: string): void {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === previousName) return;
        if (this.categories().some((c) => c.name === trimmed)) {
            this.messageService.postError({
                title: 'Kategorie existiert bereits',
                body: `Eine Kategorie mit dem Namen "${trimmed}" existiert bereits.`,
            });
            return;
        }
        if (
            this.categories().find((c) => c.name === previousName)?.templates
                .length === 0
        ) {
            this.pendingEmptyCategoryNames.update((names) =>
                names.map((name) => (name === previousName ? trimmed : name))
            );
            return;
        }
        this.exerciseService.proposeAction({
            type: '[MeasureTemplate] Rename Category',
            previousName,
            newName: trimmed,
        });
    }

    public async deleteCategory(name: string): Promise<void> {
        const category = this.categories().find((c) => c.name === name);
        if (!category || category.templates.length === 0) {
            this.pendingEmptyCategoryNames.update((names) =>
                names.filter((n) => n !== name)
            );
            return;
        }

        const confirmDelete = await this.confirmationModalService.confirm({
            title: 'Kategorie löschen',
            description: `Möchten Sie die Kategorie "${name}" wirklich löschen? Enthaltene Maßnahmen werden in eine andere Kategorie verschoben.`,
        });
        if (!confirmDelete) return;
        this.exerciseService.proposeAction({
            type: '[MeasureTemplate] Delete Category',
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
