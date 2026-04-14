import { Component, input } from '@angular/core';
import type { GetOrganisationResponseDataSchema } from 'fuesim-digital-shared';
import { RouterLink } from '@angular/router';
import { InlineTextEditorComponent } from '../../../../shared/components/inline-text-editor/inline-text-editor.component';

@Component({
    selector: 'app-organisation-badge',
    templateUrl: './organisation-badge.component.html',
    styleUrls: ['./organisation-badge.component.scss'],
    imports: [RouterLink, InlineTextEditorComponent],
})
export class OrganisationBadgeComponent {
    readonly organisation = input.required<GetOrganisationResponseDataSchema>();
}
