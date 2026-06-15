import { Component, input } from '@angular/core';
import type { GetOrganisationResponseData } from 'fuesim-digital-shared';

@Component({
    selector: 'app-organisation-badge',
    templateUrl: './organisation-badge.component.html',
    styleUrls: ['./organisation-badge.component.scss'],
    imports: [],
})
export class OrganisationBadgeComponent {
    readonly organisation = input.required<GetOrganisationResponseData>();
}
