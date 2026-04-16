import {
    Component,
    computed,
    effect,
    inject,
    input,
    OnDestroy,
    OnInit,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { UUID } from 'fuesim-digital-shared';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../../../core/exercise.service';
import { AppState } from '../../../state/app.state';
import { createSelectUserGeneratedContent } from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
@Component({
    selector: 'app-rich-text-editor',
    templateUrl: './rich-text-editor.component.html',
    styleUrls: ['./rich-text-editor.component.scss'],
    imports: [NgxEditorModule, FormsModule],
})
export class RichTextEditorComponent implements OnInit, OnDestroy {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    readonly userGeneratedContentId = input.required<UUID>();
    userGeneratedContentElement = computed(() => {
        return (
            this.store.selectSignal(
                createSelectUserGeneratedContent(this.userGeneratedContentId())
            )() ?? null
        );
    });

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
    readonly editorContent = signal<string>('');

    constructor() {
        effect(() => {
            if (this.userGeneratedContentElement()) {
                this.editorContent.set(
                    this.userGeneratedContentElement()!.content
                );
            }
        });
    }

    async ngOnInit(): Promise<void> {
        this.editor = new Editor();
    }

    onSubmit() {
        this.exerciseService.proposeAction({
            type: '[UserGeneratedContent] Update content',
            contentId: this.userGeneratedContentId(),
            newContentString: this.editorContent(),
        });
        if (!this.userGeneratedContentElement()) {
            this.userGeneratedContentElement = this.store.selectSignal(
                createSelectUserGeneratedContent(this.userGeneratedContentId())
            );
        }
    }

    ngOnDestroy(): void {
        this.editor.destroy();
    }
}
