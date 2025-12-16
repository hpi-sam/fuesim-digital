import { Component } from '@angular/core';
import { Router } from '@angular/router';
import type { ExportImportFile } from 'digital-fuesim-manv-shared';
import { escapeRegExp } from 'lodash-es';
import { ApiService } from 'src/app/core/api.service';
import { MessageService } from 'src/app/core/messages/message.service';

@Component({
    selector: 'app-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss'],
    standalone: false,
})
export class LandingPageComponent {
    public exerciseId = '';

    public exerciseHasBeenCreated = false;

    public trainerId = '';

    public participantId = '';

    constructor(
        private readonly apiService: ApiService,
        private readonly router: Router,
        private readonly messageService: MessageService
    ) {}

    public async createExercise() {
        this.apiService
            .createExercise()
            .then((ids) => {
                this.trainerId = ids.trainerId;
                this.exerciseId = this.trainerId;
                this.participantId = ids.participantId;
                this.exerciseHasBeenCreated = true;

                this.messageService.postMessage(
                    {
                        title: 'Übung erstellt',
                        body: 'Sie können nun der Übung beitreten.',
                        color: 'success',
                    },
                    'toast'
                );
            })
            .catch((error) => {
                this.messageService.postError({
                    title: 'Fehler beim Erstellen der Übung',
                    error: error.message,
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
                    const ids =
                        await this.apiService.importExercise(importPlain);
                    this.trainerId = ids.trainerId;
                    this.exerciseId = this.trainerId;
                    this.participantId = ids.participantId;
                    this.exerciseHasBeenCreated = true;

                    this.messageService.postMessage(
                        {
                            color: 'success',
                            title: 'Übung importiert',
                            body: 'Sie können nun der Übung beitreten',
                        },
                        'toast'
                    );
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
