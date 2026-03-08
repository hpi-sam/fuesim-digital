import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { ExportImportFile } from 'fuesim-digital-shared';
import { escapeRegExp } from 'lodash-es';
import { AuthService } from '../../../core/auth.service';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss'],
    standalone: false,
})
export class LandingPageComponent {
    private readonly apiService = inject(ApiService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    readonly auth = inject(AuthService);

    public loginUrl = this.auth.loginUrl;

    public exerciseId = '';

    public exerciseHasBeenCreated = false;

    public trainerKey = '';

    public participantKey = '';

    public async createExercise() {
        this.apiService.createExercise().then((exerciseKeys) => {
            this.trainerKey = exerciseKeys.trainerKey;
            this.exerciseId = this.trainerKey;
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
            const importPlain = JSON.parse(importString) as ExportImportFile;
            const type = importPlain.type;
            if (!['complete', 'partial'].includes(type)) {
                throw new Error(`Ungültiger Dateityp: \`type === ${type}\``);
            }
            switch (importPlain.type) {
                case 'complete': {
                    const exerciseKeys =
                        await this.apiService.importExercise(importPlain);
                    this.trainerKey = exerciseKeys.trainerKey;
                    this.exerciseId = this.trainerKey;
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
            this.messageService.postError({
                title: 'Fehler beim Importieren der Übung',
                error,
            });
        } finally {
            this.importingExercise = false;
        }
    }

    public pasteExerciseId(event: ClipboardEvent) {
        const pastedText = event.clipboardData?.getData('text') ?? '';
        const joinUrl = new RegExp(
            `^${escapeRegExp(location.origin)}/exercises/(\\d{6,8})$`,
            'u'
        );

        const matches = joinUrl.exec(pastedText);
        if (matches?.[1]) {
            this.exerciseId = matches[1];
            event.preventDefault();
        }
    }

    public joinExercise() {
        this.router.navigate(['/exercises', this.exerciseId]);
    }
}
