import { Component, input, output } from '@angular/core';
import { GetOrganisationDetailsResponseData } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-organisation-tab-content',
    imports: [FormsModule],
    templateUrl: './organisation-tab-content.component.html',
    styleUrl: './organisation-tab-content.component.scss',
})
export class OrganisationTabContentComponent {
    readonly organisation =
        input.required<GetOrganisationDetailsResponseData>();
    readonly update = output<boolean>();
}
