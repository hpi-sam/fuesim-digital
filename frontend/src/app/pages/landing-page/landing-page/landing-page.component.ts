import { Component, inject, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
    isAccessKey,
    isExerciseKey,
    isParallelExerciseKey,
    validateExerciseExport,
} from 'fuesim-digital-shared';
import { escapeRegExp } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import {
    form,
    FormField,
    validate,
    validateAsync,
} from '@angular/forms/signals';
import { ZodError } from 'zod';
import { AuthService } from '../../../core/auth.service';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';
import { FileInputDirective } from '../../../shared/directives/file-input.directive';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DisplayModelValidationComponent } from '../../../shared/validation/display-model-validation/display-model-validation.component';
import { HelpButtonComponent } from '../../../help-button/help-button.component.js';

@Component({
    selector: 'app-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss'],
    imports: [
        HeaderComponent,
        FormsModule,
        AutofocusDirective,
        RouterLink,
        FileInputDirective,
        FooterComponent,
        FormField,
        DisplayModelValidationComponent,
        HelpButtonComponent,
    ],
})
export class LandingPageComponent {
    private readonly apiService = inject(ApiService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    readonly auth = inject(AuthService);

    protected readonly exerciseConfig = this.apiService.exerciseConfig.value;

    public loginUrl = this.auth.loginUrl;

    public exerciseHasBeenCreated = false;

    public trainerKey = '';
    public participantKey = '';

    readonly model = signal<{ joinKey: string }>({
        joinKey: '',
    });
    readonly joinForm = form(this.model, async (schemaPath) => {
        validate(schemaPath.joinKey, ({ value }) => {
            if (!isAccessKey(value())) {
                return {
                    kind: 'no_access_key',
                    message:
                        'Die Eingabe muss eine gültige Übungs-PIN (6, 7 oder 8 Ziffern) sein.',
                };
            }
            return null;
        });
        validateAsync(schemaPath.joinKey, {
            params: ({ value }) => value(),
            factory: (key) =>
                resource({
                    params: key,
                    loader: async ({ params }) => {
                        if (isExerciseKey(params)) {
                            return (
                                await this.apiService.exerciseExists(params)
                            ).exists;
                        } else if (isParallelExerciseKey(params)) {
                            return (
                                await this.apiService.parallelExerciseExists(
                                    params
                                )
                            ).exists;
                        }
                        return false;
                    },
                }),
            onSuccess: (result: boolean) => {
                if (!result) {
                    return {
                        kind: 'username_taken',
                        message: `Es existiert keine Übung mit dieser PIN.`,
                    };
                }
                return null;
            },
            onError: () => null,
        });
    });

    public async createExercise() {
        this.apiService.createExercise().then((exerciseKeys) => {
            this.trainerKey = exerciseKeys.trainerKey;
            this.model.set({ joinKey: this.trainerKey });
            this.participantKey = exerciseKeys.participantKey;
            this.exerciseHasBeenCreated = true;

            this.messageService.postMessage({
                title: 'Übung erstellt',
                body: 'Sie können nun der Übung beitreten.',
                color: 'success',
            });
        });
    }

    public importingExercise = false;
    public async importExerciseState(fileList: FileList) {
        this.importingExercise = true;
        try {
            const importString = await fileList.item(0)?.text();
            if (importString === undefined) {
                // The file dialog has been aborted.
                return;
            }
            const importJSON = JSON.parse(importString);
            const importObject = validateExerciseExport(importJSON);

            switch (importObject.type) {
                case 'complete': {
                    const exerciseKeys =
                        await this.apiService.importExercise(importObject);
                    this.trainerKey = exerciseKeys.trainerKey;
                    this.model.set({ joinKey: this.trainerKey });
                    this.participantKey = exerciseKeys.participantKey;
                    this.exerciseHasBeenCreated = true;

                    this.messageService.postMessage({
                        color: 'success',
                        title: 'Übung importiert',
                        body: 'Sie können nun der Übung beitreten',
                    });
                    break;
                }
                case 'partial': {
                    this.messageService.postMessage({
                        color: 'danger',
                        title: 'Unerlaubter Importtyp',
                        body: 'Dieser Typ kann nur innerhalb einer Übung importiert werden.',
                    });
                    break;
                }
            }
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                this.messageService.postMessage({
                    color: 'danger',
                    title: 'Fehlerhafte Datei',
                    body: 'Die Datei hat das falsche Format.',
                });
            } else {
                this.messageService.postError({
                    title: 'Fehler beim Importieren der Übung',
                    error,
                });
            }
        } finally {
            this.importingExercise = false;
        }
    }

    public pasteExerciseKey(event: ClipboardEvent) {
        const pastedText = event.clipboardData?.getData('text') ?? '';
        const joinUrl = new RegExp(
            `^${escapeRegExp(location.origin)}/exercises.*/(\\d{6,8})$`,
            'u'
        );

        const matches = joinUrl.exec(pastedText);
        if (matches?.[1]) {
            this.model.set({ joinKey: matches[1] });
            event.preventDefault();
        }
    }

    public joinExercise() {
        const key = this.model().joinKey;
        if (isExerciseKey(key)) {
            this.router.navigate(['/exercises', this.model().joinKey]);
        } else if (isParallelExerciseKey(key)) {
            this.router.navigate([
                '/exercises/parallel/join',
                this.model().joinKey,
            ]);
        }
    }
}
