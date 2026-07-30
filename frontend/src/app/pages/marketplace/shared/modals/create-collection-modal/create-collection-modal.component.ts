import { HttpResourceRef } from '@angular/common/http';
import {
    Component,
    effect,
    inject,
    OnInit,
    output,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    disabled,
    form,
    FormField,
    validateStandardSchema,
} from '@angular/forms/signals';
import {
    CollectionVersion,
    GetOrganisationsResponseData,
    Marketplace,
    OrganisationId,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../../../core/api.service';
import { AuthService } from '../../../../../core/auth.service';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { AutofocusDirective } from '../../../../../shared/directives/autofocus.directive';
import { DisplayModelValidationComponent } from '../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-create-collection-modal',
    templateUrl: './create-collection-modal.component.html',
    styleUrl: './create-collection-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        FormField,
        DisplayModelValidationComponent,
        FormsModule,
        AutofocusDirective,
    ],
})
export class CreateCollectionModalComponent implements OnInit {
    private readonly apiService = inject(ApiService);
    private readonly authService = inject(AuthService);
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);

    public basedOnCollection: VersionedCollectionPartial | null = null;
    public prefilledName = '';

    readonly created = output<CollectionVersion | null>();

    public readonly model = signal<
        typeof Marketplace.Collection.Create.Request
    >({
        organisationId: '' as OrganisationId,
        title: '',
    });

    public readonly collectionCreationForm = form(this.model, (schemaPath) => {
        disabled(schemaPath.organisationId, () =>
            this.organisations.isLoading()
        );
        validateStandardSchema(
            schemaPath,
            Marketplace.Collection.Create.requestSchema
        );
    });

    public readonly organisations: HttpResourceRef<
        GetOrganisationsResponseData | undefined
    >;

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
    ngOnInit() {
        this.collectionCreationForm.title().value.set(this.prefilledName);
    }

    public async createNewCollection() {
        let createdCollection: CollectionVersion | null = null;
        if (this.basedOnCollection === null) {
            createdCollection = await this.collectionService.createColletion(
                this.collectionCreationForm.title().value(),
                this.collectionCreationForm.organisationId().value()
            );
        } else {
            createdCollection =
                await this.collectionService.duplicateCollection(
                    this.basedOnCollection.entityId,
                    this.basedOnCollection.versionId,
                    this.collectionCreationForm.title().value(),
                    this.collectionCreationForm.organisationId().value()
                );
        }
        this.close(createdCollection);
    }

    public close(created: CollectionVersion | null = null) {
        this.activeModal.close();
        this.created.emit(created);
    }
}
