import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import Package from '../../../../../package.json';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    imports: [RouterLink],
})
export class FooterComponent {
    version = Package.version;
}
