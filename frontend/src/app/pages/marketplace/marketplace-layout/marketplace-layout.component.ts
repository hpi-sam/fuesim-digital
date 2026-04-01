import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
    selector: 'app-marketplace-layout',
    imports: [HeaderComponent, RouterModule],
    templateUrl: './marketplace-layout.component.html',
    styleUrl: './marketplace-layout.component.scss',
})
export class MarketplaceLayoutComponent {}
