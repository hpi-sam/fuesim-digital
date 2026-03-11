import {
    Component,
    inject,
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
} from 'fuesim-digital-shared';
import { Editor, Toolbar } from 'ngx-editor';
import { ExerciseService } from '../../../core/exercise.service';
import { AppState } from '../../../state/app.state';
import { createSelectUserGeneratedContent } from '../../../state/application/selectors/exercise.selectors';
@Component({
    selector: 'app-rich-text-editor',
    templateUrl: './rich-text-editor.component.html',
    styleUrls: ['./rich-text-editor.component.scss'],
    standalone: false,
})
export class RichTextEditorComponent implements OnInit, OnDestroy {
    readonly userGeneratedContentId = input.required<UUID>();
    readonly contentAssignedElement =
        input.required<ContentAssignableElement>();
    userGeneratedContentElement: Signal<UserGeneratedContent | null> =
        signal(null);
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    editor!: Editor;
    toolbar: Toolbar = [['image']];

    /* TODO @JohannesPotzi: Validators for image urls */
    readonly editorModel = signal({
        editorContent: '',
    });
    editorForm = form(this.editorModel);
    readonly submitedContent = output<string | null | undefined>();

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
