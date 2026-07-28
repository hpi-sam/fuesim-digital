import type { CollectionEntityId } from 'fuesim-digital-shared';
import { lastValueFrom } from 'rxjs';
import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// its a nessesary evil
// eslint-disable-next-line import/no-cycle
import { MarketplaceSelectCollectionModalComponent } from './marketplace-select-collection-modal.component';

export async function openSelectCollectionModal(
    ngbModalService: NgbModal,
    opts?: {
        title?: string;
        showDependencyElements?: boolean;
        disallowedCollections?: CollectionEntityId[];
        restrictToEditable?: boolean;
        allowLeave?: boolean;
        allowCreate?: boolean;
        showInfoBanner?: boolean;
        /**
         * The text to show (as kind of a description of the action)
         * when a collection is selection is made and the user has to confirm it.
         */
        selectionInfoText?: string;
        skipOnNoChoice?: boolean;
    }
) {
    const modal = ngbModalService.open(
        MarketplaceSelectCollectionModalComponent,
        {
            size: 'lg',
            backdrop: opts?.allowLeave === false ? 'static' : true,
            beforeDismiss: () => {
                if (opts?.allowLeave === false) {
                    return false;
                }
                return true;
            },
        }
    );
    const component =
        modal.componentInstance as MarketplaceSelectCollectionModalComponent;

    component.showDependencyElements = opts?.showDependencyElements ?? false;
    component.disallowedCollections = opts?.disallowedCollections ?? [];
    component.allowLeave = opts?.allowLeave ?? true;
    component.allowCreate = opts?.allowCreate ?? false;
    component.showInfoBanner = opts?.showInfoBanner ?? false;
    component.title = opts?.title ?? 'Sammlung auswählen';
    component.restrictToEditable = opts?.restrictToEditable ?? false;
    component.selectionInfoText =
        opts?.selectionInfoText ?? component.selectionInfoText;
    component.skipOnNoChoice = opts?.skipOnNoChoice ?? false;

    const result = await lastValueFrom(component.collectionSelectionResult$);
    return result;
}
