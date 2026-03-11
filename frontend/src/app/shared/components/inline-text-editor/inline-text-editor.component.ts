import { Component, input, model, output } from '@angular/core';

@Component({
    selector: 'app-inline-text-editor',
    templateUrl: './inline-text-editor.component.html',
    styleUrls: ['./inline-text-editor.component.scss'],
    standalone: false,
})
export class InlineTextEditorComponent {
    readonly required = input<boolean>(false);
    readonly value = model<string>('');
    newValue = '';
    readonly update = output<string>();
    edit = false;

    startEdit() {
        this.newValue = this.value();
        this.edit = true;
    }

    save() {
        this.edit = false;
        this.value.set(this.newValue);
        this.update.emit(this.newValue);
        this.newValue = '';
    }
}
