import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { DisplayValidationComponent } from '../../../../../../shared/validation/display-validation/display-validation.component';

@Component({
    selector: 'app-tile-server-selector',
    imports: [
        FormsModule,
        AutofocusDirective,
        DisplayValidationComponent,
        NgbCollapse,
    ],
    templateUrl: './tile-server-selector.component.html',
    styleUrl: './tile-server-selector.component.scss',
})
export class TileServerSelectorComponent {
    public readonly url = model('');
    public readonly description = input('');
    public readonly autofocus = input(false);

    protected readonly tileUrlRegex =
        /^(?=.*\{x\})(?=.*\{-?y\})(?=.*\{z\}).*$/u;
    protected suggestionsCollapsed = true;
    protected readonly suggestions = [
        {
            name: 'Arcgis',
            description: 'Satellitenbilder (standardmäßig ausgewählt',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        },
        {
            name: 'Google Maps',
            description: 'Satellitenbilder, mit Beschriftungen',
            url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        },
        {
            name: 'Google Maps',
            description: 'Satellitenbilder, ohne Beschriftungen',
            url: 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
        },
        {
            name: 'OpenStreetMap',
            description: 'Schemazeichnung, mit Beschriftungen in Landessprache',
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        },
        {
            name: 'OpenStreetMap',
            description: 'Schemazeichnung, mit deutschen Beschriftungen',
            url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
        },
    ];

    protected selectSuggestion(url: string) {
        this.suggestionsCollapsed = true;
        this.url.set(url);
    }
}
