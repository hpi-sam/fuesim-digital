import {
    Component,
    computed,
    inject,
    input,
    OnDestroy,
    OnInit,
    signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import { UUID } from 'fuesim-digital-shared';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { ExerciseService } from '../../../core/exercise.service';
import { AppState } from '../../../state/app.state';
import { createSelectUserGeneratedContent } from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
@Component({
    selector: 'app-rich-text-editor',
    templateUrl: './rich-text-editor.component.html',
    styleUrls: ['./rich-text-editor.component.scss'],
    imports: [NgxEditorModule, FormField],
})
export class RichTextEditorComponent implements OnInit, OnDestroy {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    readonly userGeneratedContentId = input.required<UUID>();
    readonly userGeneratedContentElement = computed(() =>
        this.store.selectSignal(
            createSelectUserGeneratedContent(this.userGeneratedContentId())
        )()
    );

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

    ngOnInit(): void {
        this.editor = new Editor();
        this.editorForm
            .editorContent()
            .value.set(this.userGeneratedContentElement().content);
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
