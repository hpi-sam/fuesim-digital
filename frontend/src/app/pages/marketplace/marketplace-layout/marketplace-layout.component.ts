import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CollectionService } from '../../../core/exercise-element.service';
import {
    CollectionEntityId,
    isCollectionEntityId,
    Marketplace,
} from 'fuesim-digital-shared';
import {
    ActivatedRoute,
    Event,
    NavigationEnd,
    Router,
    RouterModule,
} from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { NgbNav } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-marketplace-layout',
    imports: [HeaderComponent, RouterModule, NgbNav],
    templateUrl: './marketplace-layout.component.html',
    styleUrl: './marketplace-layout.component.scss',
})
export class MarketplaceLayoutComponent implements OnDestroy {
    private readonly collectionService = inject(CollectionService);
    private readonly router = inject(Router);

    private readonly destroy$ = new Subject<void>();

    public currentlySelectedSetEntityId = signal<CollectionEntityId | null>(
        null
    );

    public constructor() {
        this.collectionService.loadCollections();
        this.router.events
            .pipe(takeUntil(this.destroy$))
            .subscribe((event: Event) => {
                if (event instanceof NavigationEnd) {
                    const urlSegments = event.urlAfterRedirects.split('/');
                    const marketplaceIndex = urlSegments.findIndex(
                        (segment) => segment === 'marketplace'
                    );

                    const setEntityIdIndex = marketplaceIndex + 1;

                    if (
                        marketplaceIndex === -1 ||
                        urlSegments.length <= setEntityIdIndex
                    )
                        return;

                    const setEntityIdSegment =
                        urlSegments[marketplaceIndex + 1];

                    if (!setEntityIdSegment) return;

                    this.currentlySelectedSetEntityId.set(
                        isCollectionEntityId(setEntityIdSegment)
                            ? setEntityIdSegment
                            : null
                    );
                }
            });
    }

    public get elementSets() {
        return this.collectionService.elementSets();
    }

    public async createNewExercise() {
        //TODO: @Quixelation
        const exerciseSetName = prompt('Name of the new exercise set');

        await this.collectionService.createColletion(
            exerciseSetName ?? 'New Exercise Set'
        );
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
