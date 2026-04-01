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
    imports: [HeaderComponent, RouterModule],
    templateUrl: './marketplace-layout.component.html',
    styleUrl: './marketplace-layout.component.scss',
})
export class MarketplaceLayoutComponent {}
