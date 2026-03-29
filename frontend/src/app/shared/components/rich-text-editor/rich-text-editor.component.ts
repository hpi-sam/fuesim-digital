import {
    Component,
    inject,
    input,
    OnDestroy,
    OnInit,
    signal,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import {
    ContentAssignableElement,
    newUserGeneratedContent,
    UserGeneratedContent,
    UUID,
} from 'fuesim-digital-shared';
import { Editor, Toolbar } from 'ngx-editor';
import { ExerciseService } from '../../../core/exercise.service';
import { AppState } from '../../../state/app.state';
import { createSelectUserGeneratedContent } from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
@Component({
    selector: 'app-rich-text-editor',
    templateUrl: './rich-text-editor.component.html',
    styleUrls: ['./rich-text-editor.component.scss'],
    standalone: false,
})
export class RichTextEditorComponent implements OnInit, OnDestroy {
    readonly userGeneratedContentId = input.required<UUID>();
    readonly userGeneratedContentElement = signal<UserGeneratedContent | null>(
        null
    );
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    public readonly currentRole = this.store.selectSignal(
        selectCurrentMainRole
    );
    editor!: Editor;
    toolbar: Toolbar = [
        ['bold', 'italic'],
        ['underline', 'strike'],
        ['blockquote'],
        ['ordered_list', 'bullet_list'],
        ['link', 'image'],
        ['text_color', 'background_color'],
        ['align_left', 'align_center', 'align_right', 'align_justify'],
    ];
    readonly editorModel = signal({
        editorContent: '',
    });
    editorForm = form(this.editorModel);

    async ngOnInit(): Promise<void> {
        this.editor = new Editor();
        await this.userGeneratedContentElement.set(
            this.store.selectSignal(
                createSelectUserGeneratedContent(this.userGeneratedContentId())
            )()
        );
        this.editorForm
            .editorContent()
            .value.set(this.userGeneratedContentElement()!.content);
    }
    onSubmit() {
        this.exerciseService.proposeAction({
            type: '[UserGeneratedContent] Update content',
            contentId: this.userGeneratedContentId(),
            newContentString: this.editorForm.editorContent().value(),
        });
        console.log(
            'content updated! New value: ' +
                this.userGeneratedContentElement()?.content
        );
    }
    ngOnDestroy(): void {
        this.editor.destroy();
    }
}
