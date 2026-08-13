import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import type { GetOrganisationResponseData } from 'fuesim-digital-shared';

@Component({
    selector: 'app-organisation-badge',
    templateUrl: './organisation-badge.component.html',
    styleUrls: ['./organisation-badge.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [],
})
export class OrganisationBadgeComponent {
    readonly organisation = input.required<GetOrganisationResponseData>();
}
