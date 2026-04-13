import { CollectionEntityId } from 'fuesim-digital-shared';
import { lastValueFrom } from 'rxjs';
import { MarketplaceSelectCollectionModalComponent } from './marketplace-select-collection-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export async function openSelectCollectionModal(
    ngbModalService: NgbModal,
    opts?: {
        showDependencyElements?: boolean;
        disallowedCollections?: CollectionEntityId[];
    }
) {
    const modal = ngbModalService.open(
        MarketplaceSelectCollectionModalComponent,
        {
            size: 'xl',
        }
    );
    const component =
        modal.componentInstance as MarketplaceSelectCollectionModalComponent;

    component.showDependencyElements = opts?.showDependencyElements ?? false;
    component.disallowedCollections = opts?.disallowedCollections ?? [];

    const result = await lastValueFrom(component.collectionSelectionResult$);
    return result;
}
