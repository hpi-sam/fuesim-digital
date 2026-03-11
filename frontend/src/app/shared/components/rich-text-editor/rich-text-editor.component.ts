import {
    Component,
    input,
    OnDestroy,
    OnInit,
    output,
    Signal,
    signal,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import {
    ContentAssignableElement,
    newUserGeneratedContent,
    UserGeneratedContent,
    UUID,
} from 'digital-fuesim-manv-shared';
import { Editor, Toolbar } from 'ngx-editor';
import { ExerciseService } from 'src/app/core/exercise.service';
import { AppState } from 'src/app/state/app.state';
import { createSelectUserGeneratedContent } from 'src/app/state/application/selectors/exercise.selectors';
@Component({
    selector: 'app-rich-text-editor',
    templateUrl: './rich-text-editor.component.html',
    styleUrls: ['./rich-text-editor.component.scss'],
    standalone: false,
})
export class RichTextEditorComponent implements OnInit, OnDestroy {
    userGeneratedContentId = input.required<UUID>();
    contentAssignedElement = input.required<ContentAssignableElement>();
    userGeneratedContentElement: Signal<UserGeneratedContent | null> =
        signal(null);
    editor!: Editor;
    toolbar: Toolbar = [['image']];

    /* TODO @JohannesPotzi: Validators for image urls */
    editorModel = signal({
        editorContent: '',
    });
    editorForm = form(this.editorModel);
    readonly submitedContent = output<string | null | undefined>();

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}
    ngOnInit(): void {
        this.editor = new Editor();

        this.userGeneratedContentElement = this.store.selectSignal(
            createSelectUserGeneratedContent(this.userGeneratedContentId())
        );
        this.editorForm
            .editorContent()
            .value.set(this.userGeneratedContentElement()!.content);
    }
    public assignContent(element: ContentAssignableElement) {
        this.exerciseService.proposeAction({
            type: '[UserGeneratedContent] Assign new content to element',
            elementId: element.id,
            content: newUserGeneratedContent(),
        });
    }
    onSubmit() {
        this.exerciseService.proposeAction({
            type: '[UserGeneratedContent] Update content',
            contentId: this.userGeneratedContentId(),
            newContentString: this.editorForm.editorContent().value(),
        });
    }
    ngOnDestroy(): void {
        this.editor.destroy();
    }
}
