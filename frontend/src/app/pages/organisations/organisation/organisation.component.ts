import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import {
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import {
    GetOrganisationDetailsResponseData,
    PatchOrganisationRequestData,
} from 'fuesim-digital-shared';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { InlineTextEditorComponent } from '../../../shared/components/inline-text-editor/inline-text-editor.component';
import { AuthService } from '../../../core/auth.service';
import { OrganisationTabMembersComponent } from '../tabs/members/organisation-tab-members.component.js';
import { OrganisationTabSettingsComponent } from '../tabs/settings/organisation-tab-settings.component.js';
import { OrganisationTabExercisesComponent } from '../tabs/exercises/organisation-tab-exercises.component.js';
import { OrganisationTabExerciseTemplatesComponent } from '../tabs/exercise-templates/organisation-tab-exercise-templates.component.js';
import { OrganisationTabParallelExercisesComponent } from '../tabs/parallel-exercises/organisation-tab-parallel-exercises.component.js';
import { OrganisationTabExerciseElementsComponent } from '../tabs/exercise-elements/organisation-tab-exercise-elements.component';

@Component({
    selector: 'app-organisation',
    templateUrl: './organisation.component.html',
    styleUrls: ['./organisation.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        HeaderComponent,
        FooterComponent,
        InlineTextEditorComponent,
        NgbNav,
        NgbNavItem,
        NgbNavOutlet,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavContent,
        FormsModule,
        OrganisationTabMembersComponent,
        OrganisationTabSettingsComponent,
        OrganisationTabExercisesComponent,
        OrganisationTabExerciseTemplatesComponent,
        OrganisationTabParallelExercisesComponent,
        OrganisationTabExerciseElementsComponent,
    ],
})
export class OrganisationComponent {
    private readonly apiService = inject(ApiService);
    private readonly route = inject(ActivatedRoute);
    readonly authService = inject(AuthService);

    organisation: HttpResourceRef<
        GetOrganisationDetailsResponseData | undefined
    >;

    reload() {
        this.organisation.reload();
    }

    async patchOrganisation(data: PatchOrganisationRequestData) {
        const organisation = this.organisation.value();
        if (!organisation) return;
        await this.apiService.patchOrganisation(organisation.id, data);
        this.organisation.reload();
    }

    constructor() {
        this.organisation = this.apiService.getOrganisationResource(
            this.route.snapshot.params['id']
        );
    }
}
