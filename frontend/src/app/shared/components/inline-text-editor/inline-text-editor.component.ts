import { Component, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-inline-text-editor',
    templateUrl: './inline-text-editor.component.html',
    styleUrls: ['./inline-text-editor.component.scss'],
    standalone: false,
})
export class InlineTextEditorComponent {
    value = input<string>('');
    edit = false;

    save() {
        this.edit = false;
    }
}
