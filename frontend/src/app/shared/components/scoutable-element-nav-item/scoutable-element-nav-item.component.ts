import {
    Component,
    computed,
    effect,
    inject,
    input,
    linkedSignal,
    OnInit,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
    cloneDeepMutable,
    newScoutable,
    newUserGeneratedContent,
    ScoutableElement,
    userGeneratedContentSchema,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import type { UserGeneratedContent, Scoutable } from 'fuesim-digital-shared';
import { form, validateStandardSchema } from '@angular/forms/signals';
import { z } from 'zod';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
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
        NgbTooltip,
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

    readonly model = linkedSignal<
        Scoutable | null,
        {
            name: string;
            content: UserGeneratedContent;
            isVisibleForParticipants: boolean;
        }
    >({
        source: this.scoutable,
        computation: (scoutable, previous) => {
            if (previous && this.hasLocalEdits()) return previous.value;

            return {
                name: scoutable?.name ?? '',
                content:
                    scoutable?.userGeneratedContent ??
                    newUserGeneratedContent(),
                isVisibleForParticipants:
                    scoutable?.isVisibleForParticipants ?? true,
            };
        },
    });
    scoutableForm = form(this.model, (schemaPath) => {
        validateStandardSchema(
            schemaPath,
            z.object({
                name: z.string(),
                content: userGeneratedContentSchema,
                isVisibleForParticipants: z.boolean(),
            })
        );
    });
    readonly hasLocalEdits = signal<boolean>(false);

    constructor() {
        effect(() => {
            const value = this.model();
            const isValid = this.scoutableForm().valid();
            const isDirty = this.scoutableForm().dirty();

            if (isDirty && isValid) {
                this.hasLocalEdits.set(false);
                this.scoutableForm().reset();
                if (
                    value.name.trim() === '' &&
                    (value.content.content.trim() === '' ||
                        value.content.content === '<p></p>')
                ) {
                    if (this.element().scoutableId !== null)
                        this.removeScoutability();
                    return;
                } else if (this.element().scoutableId === null) {
                    const draftScoutable = cloneDeepMutable(newScoutable());
                    draftScoutable.name = value.name;
                    draftScoutable.userGeneratedContent = value.content;
                    draftScoutable.isVisibleForParticipants =
                        value.isVisibleForParticipants;
                    this.makeScoutable(this.element(), draftScoutable);
                    return;
                }
                const scoutable = this.scoutable()!;
                if (value.name !== scoutable.name) this.rename(value.name);
                if (
                    value.content.content !==
                    scoutable.userGeneratedContent.content
                )
                    this.updateContent(value.content);
                if (
                    value.isVisibleForParticipants !==
                    scoutable.isVisibleForParticipants
                )
                    this.setVisibility(value.isVisibleForParticipants);
            }
        });
    }

    ngOnInit() {
        if (this.currentRole() === 'participant') {
            this.markAsViewed();
        }
    }

    private rename(name: string) {
        this.exerciseService.proposeAction(
            {
                type: '[Scoutable] Rename',
                scoutableId: this.scoutable()!.id,
                name,
            },
            true
        );
    }

    private updateContent(content: UserGeneratedContent) {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Update content',
            scoutableId: this.scoutable()!.id,
            userGeneratedContent: content,
        });
    }

    private setVisibility(value: boolean) {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Set isVisibleForParticipants',
            scoutableId: this.scoutable()!.id,
            value,
        });
    }

    makeScoutable(element: ScoutableElement, scoutable: Scoutable) {
        this.exerciseService.proposeAction(
            {
                type: '[Scoutable] Make scoutable',
                elementId: element.id,
                elementType: element.type,
                scoutable,
            },
            true
        );
    }

    removeScoutability() {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Remove scoutability',
            elementType: this.element().type,
            elementId: this.element().id,
        });
    }

    markAsViewed() {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Mark as viewed',
            scoutableId: this.scoutable()!.id,
        });
    }

    changeName(name: string) {
        this.model.update(({ ...model }) => ({ ...model, name }));
        this.scoutableForm.name().markAsDirty();
        this.hasLocalEdits.set(true);
    }

    changeContent(content: UserGeneratedContent) {
        this.model.update(({ ...model }) => ({ ...model, content }));
        this.scoutableForm.content().markAsDirty();
        this.hasLocalEdits.set(true);
    }

    changeVisibility(isVisibleForParticipants: boolean) {
        this.model.update(({ ...model }) => ({
            ...model,
            isVisibleForParticipants,
        }));
        this.scoutableForm.isVisibleForParticipants().markAsDirty();
        this.hasLocalEdits.set(true);
    }
}
