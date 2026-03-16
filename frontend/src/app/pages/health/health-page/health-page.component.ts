import { Component } from '@angular/core';

@Component({
    selector: 'app-health-page',
    templateUrl: './health-page.component.html',
    styleUrls: ['./health-page.component.scss'],
})
/**
 * This page is used to determine whether the frontend itself is running.
 * It should be independent from any other services that may or may not be running.
 * This is used for the Cypress CI.
 */
export class HealthPageComponent {}
