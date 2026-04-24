import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DisplayValidationComponent } from '../../validation/display-validation/display-validation.component';
import { AutofocusDirective } from '../../directives/autofocus.directive';

@Component({
    selector: 'app-inline-text-editor',
    templateUrl: './inline-text-editor.component.html',
    styleUrls: ['./inline-text-editor.component.scss'],
    imports: [FormsModule, DisplayValidationComponent, AutofocusDirective],
})
export class InlineTextEditorComponent {
    readonly required = input<boolean>(false);
    readonly singleLine = input<boolean>(false);
    readonly name = input.required<string>();
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
