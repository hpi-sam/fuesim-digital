import {
    Component,
    computed,
    inject,
    input,
    OnInit,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { newScoutable, ScoutableElement } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import type { UserGeneratedContent, Scoutable } from 'fuesim-digital-shared';
import { form, validateStandardSchema } from '@angular/forms/signals';
import { z } from 'zod';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { AppState } from '../../../state/app.state';
import { ExerciseService } from '../../../core/exercise.service';
import { createSelectScoutable } from '../../../state/application/selectors/exercise.selectors';
import { UserGeneratedContentEditorComponent } from '../user-generated-content-editor/user-generated-content-editor.component.js';
import { DisplayValidationComponent } from '../../validation/display-validation/display-validation.component.js';
import { AppSaveOnTypingDirective } from '../../directives/app-save-on-typing.directive.js';

@Component({
    selector: 'app-scoutable-element-nav-item',
    templateUrl: './scoutable-element-nav-item.component.html',
    styleUrls: ['./scoutable-element-nav-item.component.scss'],
    imports: [
        UserGeneratedContentEditorComponent,
        FormsModule,
        DisplayValidationComponent,
        AppSaveOnTypingDirective,
    ],
})
export class ScoutableElementNavItemComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    readonly element = input.required<ScoutableElement>();
    readonly scoutable = computed<Scoutable | null>(() => {
        const element = this.element();
        if (!element.scoutableId) return null;
        return this.store.selectSignal(
            createSelectScoutable(element.scoutableId)
        )();
    });
    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);

    readonly model = signal<{ name: string }>({
        name: '',
    });
    scoutableForm = form(this.model, (schemaPath) => {
        validateStandardSchema(schemaPath, z.object({ name: z.string() }));
    });

    ngOnInit() {
        if (this.element().scoutableId === null) {
            this.makeScoutable(this.element());
        }
        if (this.currentRole() === 'participant') {
            this.markAsViewed();
        }
    }

    makeScoutable(element: ScoutableElement) {
        this.exerciseService.proposeAction(
            {
                type: '[Scoutable] Make scoutable',
                elementId: element.id,
                elementType: element.type,
                scoutable: newScoutable(),
            },
            true
        );
    }

    markAsViewed() {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Mark as viewed',
            scoutableId: this.scoutable()!.id,
        });
    }

    rename(name: string) {
        this.exerciseService.proposeAction(
            {
                type: '[Scoutable] Rename',
                scoutableId: this.scoutable()!.id,
                name,
            },
            true
        );
    }

    setVisibility(value: boolean) {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Set isVisibleForParticipants',
            scoutableId: this.scoutable()!.id,
            value,
        });
    }

    updateContent(content: UserGeneratedContent) {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Update content',
            scoutableId: this.scoutable()!.id,
            userGeneratedContent: content,
        });
    }
}
