import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { DisplayValidationComponent } from '../../../../../../shared/validation/display-validation/display-validation.component';

@Component({
    selector: 'app-tile-server-selector',
    imports: [FormsModule, AutofocusDirective, DisplayValidationComponent],
    templateUrl: './tile-server-selector.component.html',
    styleUrl: './tile-server-selector.component.scss',
})
export class TileServerSelectorComponent {
    public readonly url = model('');
    public readonly description = input('');
    public readonly autofocus = input(false);

    public readonly tileUrlRegex = /^(?=.*\{x\})(?=.*\{-?y\})(?=.*\{z\}).*$/u;
}
