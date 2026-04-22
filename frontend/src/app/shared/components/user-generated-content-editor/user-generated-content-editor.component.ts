import {
    Component,
    computed,
    inject,
    linkedSignal,
    model,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { FormsModule } from '@angular/forms';
import type { UserGeneratedContent } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../core/exercise.service';
import { AppState } from '../../../state/app.state';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-user-generated-content-editor',
    templateUrl: './user-generated-content-editor.component.html',
    styleUrls: ['./user-generated-content-editor.component.scss'],
    imports: [NgxEditorModule, FormsModule],
})
export class UserGeneratedContentEditorComponent implements OnInit, OnDestroy {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly userGeneratedContent = model.required<UserGeneratedContent>();

    readonly editorContent = linkedSignal<string>(
        () => this.userGeneratedContent().content
    );
    public readonly currentRole = this.store.selectSignal(
        selectCurrentMainRole
    );
    public readonly isChanged = computed<boolean>(
        () => this.editorContent() !== this.userGeneratedContent().content
    );
    editor!: Editor;
    toolbar: Toolbar = [
        ['bold', 'italic'],
        ['underline', 'strike'],
        ['blockquote'],
        ['ordered_list', 'bullet_list'],
        ['link'],
        ['text_color', 'background_color'],
        ['align_left', 'align_center', 'align_right', 'align_justify'],
    ];

    async ngOnInit(): Promise<void> {
        this.editor = new Editor();
    }

    ngOnDestroy(): void {
        this.editor.destroy();
    }

    public submit(): void {
        this.userGeneratedContent.set({
            ...this.userGeneratedContent(),
            content: this.editorContent(),
        });
    }
}
