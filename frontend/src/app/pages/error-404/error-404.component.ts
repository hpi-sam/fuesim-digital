import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
    selector: 'app-error-404',
    templateUrl: './error-404.component.html',
    styleUrls: ['./error-404.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [HeaderComponent, RouterLink, FooterComponent],
})
export class Error404Component {}
