import {
    Component,
    computed,
    effect,
    inject,
    input,
    resource,
    signal,
} from '@angular/core';
import {
    checkCollectionRole,
    CollectionDto,
    collectionRelationshipTypeAllowedValues,
    collectionRelationshipTypeSchema,
} from 'fuesim-digital-shared';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../../core/exercise-element.service';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { CollectionRelationshipTypeDisplayNamePipe } from '../../../../shared/pipes/collection-relationship-type-display-name.pipe';
import { AuthService } from '../../../../core/auth.service';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service';

@Component({
    selector: 'app-collection-details-tab',
    imports: [
        FormsModule,
        DisplayValidationComponent,
        CopyButtonComponent,
        NgbTooltip,
        NgbDropdownModule,
        CollectionRelationshipTypeDisplayNamePipe,
    ],
    templateUrl: './collection-properties-tab.component.html',
    styleUrl: './collection-properties-tab.component.scss',
})
export class CollectionDetailsTabComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    public readonly allowedRoleValues = collectionRelationshipTypeAllowedValues;

    public readonly collection = input.required<CollectionDto>();

    public readonly members = resource({
        params: () => ({
            collectionEntityId: this.collection().entityId,
        }),
        loader: async ({ params: { collectionEntityId } }) =>
            (
                await this.collectionService.getCollectionMembers(
                    collectionEntityId
                )
            )
                .sort((a, b) => b.displayName.localeCompare(a.displayName))
                .sort(
                    (a, b) =>
                        checkCollectionRole(b.role).indexOf() -
                        checkCollectionRole(a.role).indexOf()
                ),
    });

    public readonly ownUserId = computed(
        () => this.authService.authData().user?.id
    );

    public readonly inviteCode = resource({
        params: () => ({
            collectionEntityId: this.collection().entityId,
        }),
        loader: async ({ params: { collectionEntityId } }) =>
            this.collectionService.getCollectionInviteCode(collectionEntityId),
    });
    public readonly inviteJoinLink = computed(() => {
        const inviteCode = this.inviteCode.value();
        return inviteCode
            ? `${location.protocol}//${location.host}/collections/${this.collection().entityId}?join=${inviteCode.code}`
            : '';
    });

    public readonly collectionTitle = signal('');

    constructor() {
        effect(() => {
            this.collectionTitle.set(this.collection().title);
        });
    }

    public async createInviteCode() {
        const result = await this.collectionService.createCollectionInviteCode(
            this.collection().entityId
        );
        this.inviteCode.set(result);
    }

    public async revokeInviteCode() {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Einladungslink widerrufen',
            description:
                'Möchten Sie den Einladungslink wirklich widerrufen? Dadurch verlieren alle Personen, die den Link haben, den Zugriff auf die Sammlung. Bereits eingeladene Personen können die Sammlung weiterhin nutzen.',
            confirmationButtonText: 'Einladungslink widerrufen',
        });
        if (!confirmationResult) return;
        await this.collectionService.revokeCollectionInviteCode(
            this.collection().entityId
        );
        this.inviteCode.set(undefined);
    }

    public async removeCollectionMember(userId: string, userName: string) {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Mitglied entfernen',
            description: `Möchten Sie ${userName} wirklich entfernen? Dadurch verliert die Person den Zugriff auf die Sammlung. Die Person kann die Sammlung erneut betreten, wenn sie einen gültigen Einladungslink hat.`,
        });
        if (!confirmationResult) return;
        await this.collectionService.removeCollectionMember(
            this.collection().entityId,
            userId
        );
    }

    public async updateCollectionMemberRole(userId: string, newRole: Event) {
        const parsedRole = collectionRelationshipTypeSchema.parse(
            (newRole.target as HTMLSelectElement).value
        );

        await this.collectionService.setCollectionMemberRole(
            this.collection().entityId,
            userId,
            parsedRole
        );
    }

    public async updateCollectionTitle() {
        await this.collectionService.updateCollectionData(
            this.collection().entityId,
            {
                title: this.collectionTitle(),
            }
        );
    }

    public async makeCollectionPublic() {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Sammlung veröffentlichen',
            description:
                'Möchten Sie diese Sammlung wirklich veröffentlichen? Dadurch wird sie für alle Nutzer sichtbar und nutzbar. Diese Aktion kann nicht rückgängig gemacht werden.',
            confirmationString: 'veröffentlichen',
            confirmationButtonText: 'Sammlung veröffentlichen',
        });
        if (!confirmationResult) return;
        await this.collectionService.makeCollectionPublic(
            this.collection().entityId
        );
    }

    public async archiveCollection() {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Sammlung archivieren',
            description: 'Möchten Sie diese Sammlung wirklich archivieren?',
            confirmationButtonText: 'Sammlung archivieren',
        });
        if (!confirmationResult) return;
        await this.collectionService.archiveCollection(
            this.collection().entityId
        );
        this.router.navigate(['/collections']);
    }
}
