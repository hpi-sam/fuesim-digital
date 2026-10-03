import { Component, input } from '@angular/core';

@Component({
    selector: 'app-sidebar-header',
    imports: [],
    templateUrl: './sidebar-header.component.html',
    styleUrl: './sidebar-header.component.scss',
})
export class SidebarHeaderComponent {
    public readonly title = input('');
}
