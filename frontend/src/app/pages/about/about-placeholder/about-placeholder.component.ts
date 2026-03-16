import { Location as NgLocation, AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import type { Observable } from 'rxjs';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
    selector: 'app-about-placeholder',
    templateUrl: './about-placeholder.component.html',
    styleUrls: ['./about-placeholder.component.scss'],
    imports: [HeaderComponent, FooterComponent, AsyncPipe],
})
export class AboutPlaceholderComponent implements OnInit {
    private readonly location = inject(NgLocation);
    private readonly http = inject(HttpClient);

    content$!: Observable<string>;

    /**
     * The title of the page shown as h2 headline.
     */
    readonly pageTitle = input('');

    /**
     * The filename in the assets/about/ directory where the page content should be loaded from.
     */
    readonly contentFile = input('');

    ngOnInit(): void {
        this.content$ = this.http.get(`assets/about/${this.contentFile()}`, {
            responseType: 'text',
        });
    }

    back(event: MouseEvent): void {
        event.preventDefault();

        if (history.length > 1) {
            this.location.back();
        } else {
            window.close();
        }
    }
}
