import type { Type } from '@angular/core';
import type { Coordinate } from 'ol/coordinate';
import type OlMap from 'ol/Map';
import type { UUID } from 'fuesim-digital-shared';
import type { OpenPopupOptions } from './popup-manager';
import { calculatePopupPositioning } from './calculate-popup-positioning';

/**
 * Allows positioning a popup relative to a single point
 *
 * For some features, especially large rectangles, we simply want to position
 * a popup relative to the coordinate of the click.
 */
export class PointRelativePopupHelper {
    constructor(private readonly olMap: OlMap) {}

    /**
     * @param component {@link OpenPopupOptions.component}
     * @param point the coordinate where the popup should be positioned at
     * @param closingUUIDs {@link OpenPopupOptions.closingUUIDs}
     * @param markedForTrainerUUIDs {@link OpenPopupOptions.markedForTrainerUUIDs}
     * @param markedForParticipantUUIDs {@link OpenPopupOptions.markedForParticipantUUIDs}
     * @param changedLayers {@link OpenPopupOptions.changedLayers}
     * @param context {@link OpenPopupOptions.context}
     */
    public getPopupOptions<Component>(
        component: Type<Component>,
        point: Coordinate,
        closingUUIDs: UUID[],
        markedForTrainerUUIDs: UUID[],
        markedForParticipantUUIDs: UUID[],
        changedLayers: string[],
        context: Partial<Component>
    ): OpenPopupOptions<Component> {
        const zoom = this.olMap.getView().getZoom()!;
        const margin = 10 / zoom;

        const { position, positioning } = calculatePopupPositioning(
            point,
            {
                height: margin,
                width: margin,
            },
            this.olMap.getView().getCenter()!
        );

        return {
            // TODO: it seems like this property is never used...
            elementUUID: undefined,
            component,
            closingUUIDs,
            markedForParticipantUUIDs,
            markedForTrainerUUIDs,
            changedLayers,
            position,
            positioning,
            context,
        };
    }
}
