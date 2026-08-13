import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import Package from '../../../../../package.json';
import { environment } from '../../../../environments/environment.js';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink],
})
export class FooterComponent {
    readonly version = Package.version;
    readonly docsUrl = environment.docsUrl;
}
