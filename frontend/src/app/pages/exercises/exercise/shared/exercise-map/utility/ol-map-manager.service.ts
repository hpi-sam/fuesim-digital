import { Injectable } from '@angular/core';
import { OlMapManager } from './ol-map-manager';

@Injectable({
    providedIn: 'root',
})
export class OlMapManagerService {
    public olMapManager?: OlMapManager;
}
