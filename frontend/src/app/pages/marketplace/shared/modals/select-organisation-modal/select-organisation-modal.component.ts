import { Component, effect, inject, signal } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import {
    form,
    disabled,
    validateStandardSchema,
    FormField,
} from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    GetOrganisationsResponseData,
    OrganisationId,
    organisationIdSchema,
} from 'fuesim-digital-shared';
import { z } from 'zod';
import { Subject } from 'rxjs';
import { ApiService } from '../../../../../core/api.service';
import { AuthService } from '../../../../../core/auth.service';
import { DisplayModelValidationComponent } from '../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-select-organisation-modal',
    templateUrl: './select-organisation-modal.component.html',
    styleUrls: ['./select-organisation-modal.component.scss'],
    imports: [FormField, DisplayModelValidationComponent],
})
export class SelectOrganisationModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly authService = inject(AuthService);

    public descriptionText!: string;
    public readonly selected$ = new Subject<OrganisationId>();

    readonly model = signal<{
        organisationId: OrganisationId;
    }>({
        organisationId: '' as OrganisationId,
    });
    readonly importFileName = signal<string | null>(null);
    readonly organisationLocked = signal<boolean>(false);

    readonly selectOrgaForm = form(this.model, (schemaPath) => {
        disabled(
            schemaPath.organisationId,
            () => this.organisations.isLoading() || this.organisationLocked()
        );
        validateStandardSchema(
            schemaPath,
            z.object({
                organisationId: organisationIdSchema,
            })
        );
    });

    organisations: HttpResourceRef<GetOrganisationsResponseData | undefined>;

    constructor() {
        this.organisations = this.apiService.getOrganisationsAsEditorResource();
        effect(() => {
            const orgs = this.organisations.value();
            if (orgs?.length && !this.model().organisationId) {
                const userId = this.authService.authData().user!.id;
                const userOrg = orgs.find(
                    (org) => org.personalOrganisationOf === userId
                );
                if (userOrg) {
                    this.model.set({
                        ...this.model(),
                        organisationId: userOrg.id,
                    });
                }
            }
        });
    }

    public setOrganisation(organisationId: OrganisationId) {
        this.model.set({ ...this.model(), organisationId });
        this.organisationLocked.set(true);
    }

    public selectOrganisation() {
        this.close(this.selectOrgaForm.organisationId().value());
    }

    public close(organisationId?: OrganisationId) {
        if (organisationId) {
            this.selected$.next(organisationId);
        }
        this.selected$.complete();
        this.activeModal.close();
    }
}
