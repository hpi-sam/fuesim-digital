import { AsyncPipe, JsonPipe } from '@angular/common';
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
    CollectionDto,
    CollectionEntityId,
    CollectionRelationshipType,
    collectionRelationshipTypeAllowedValues,
    collectionRelationshipTypeSchema,
} from 'fuesim-digital-shared';
import { CollectionService } from '../../../../core/exercise-element.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { NgbDropdown, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CollectionRelationshipTypeDisplayNamePipe } from '../../../../shared/pipes/collection-relationship-type-display-name.pipe';
import { AuthService } from '../../../../core/auth.service';

@Component({
    selector: 'app-collection-details-tab',
    imports: [
        FormsModule,
        DisplayValidationComponent,
        CopyButtonComponent,
        JsonPipe,
        NgbDropdownModule,
        CollectionRelationshipTypeDisplayNamePipe,
    ],
    templateUrl: './collection-details-tab.component.html',
    styleUrl: './collection-details-tab.component.scss',
})
export class CollectionDetailsTabComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    public readonly allowedRoleValues = collectionRelationshipTypeAllowedValues;

    public readonly collection = input.required<CollectionDto>();

    public readonly members = resource({
        params: () => ({
            collectionEntityId: this.collection().entityId,
        }),
        loader: async ({ params: { collectionEntityId } }) => {
            return await this.collectionService.getCollectionMembers(
                collectionEntityId
            );
        },
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
            ? `${location.protocol}//${location.host}/api/collections/join/${inviteCode.code}`
            : '';
    });

    public readonly collectionTitle = signal('');

    constructor() {
        effect(() => {
            this.collectionTitle.set(this.collection().title);
        });
    }

    public async createInviteCode() {
        const result =
            await this.collectionService.getOrCreateCollectionInviteCode(
                this.collection().entityId
            );
        this.inviteCode.set(result);
    }

    public async removeCollectionMember(userId: string) {
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

    public async makeSetPublic() {
        await this.collectionService.makeCollectionPublic(
            this.collection().entityId
        );
    }

    public async deleteSet() {
        await this.collectionService.deleteCollection(
            this.collection().entityId
        );
        this.router.navigate(['/marketplace']);
    }
}
