import { IsObject } from 'class-validator';
import RBush from 'rbush';
// @ts-expect-error doesn't have a type
import knn from 'rbush-knn';
import type { Immutable, WritableDraft } from 'immer';
import type { JsonObject } from '../../utils/immutability.js';
import type { UUID } from '../../utils/uuid.js';
import { getCreate } from './get-create.js';
import type { MapCoordinates } from './position/map-coordinates.js';
import type { Size } from './size.js';

/**
 * A data structure that enables efficient search of elements (interpreted as points) in a circle or rectangle
 * @see https://blog.mapbox.com/a-dive-into-spatial-search-algorithms-ebd0c5e39d2a
 */
export class SpatialTree {
    /**
     * If you change this, you have to add a state migration for it, else the rbush tree cannot be reconstructed
     * @see https://github.com/mourner/rbush#export-and-import
     */
    private static readonly rBushNodeSize = 9;

    /**
     * This must only be mutated by the static functions of this class
     */
    @IsObject()
    public readonly spatialTreeAsJSON: Immutable<JsonObject> = new PointRBush(
        SpatialTree.rBushNodeSize
    ).toJSON();

    static readonly create = getCreate(this);

    /**
     * @deprecated Use {@link create} instead
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    constructor() {}

    /**
     * @param spatialTree inlcuding a {@link PointRBush} saved in {@link spatialTreeAsJSON} as an {@link Immutable<JsonObject>}
     * @returns a new {@link PointRBush} with all the methods to search, add etc. elements in it
     */
    private static getPointRBush(spatialTree: SpatialTree) {
        // PointRBush.fromJSON() runs in O(1)
        return new PointRBush(this.rBushNodeSize).fromJSON(
            spatialTree.spatialTreeAsJSON
        );
    }

    /**
     * Writes the {@link PointRBush} as an {@link Immutable<JsonObject>} into {@link spatialTree}
     */
    private static savePointRBush(
        spatialTree: WritableDraft<SpatialTree>,
        pointRBush: PointRBush
    ) {
        // PointRBush.toJSON() runs in O(1)
        spatialTree.spatialTreeAsJSON = pointRBush.toJSON();
    }

    public static addElement(
        spatialTree: WritableDraft<SpatialTree>,
        elementId: UUID,
        position: MapCoordinates
    ) {
        const pointRBush = this.getPointRBush(spatialTree);
        pointRBush.insert({
            position,
            id: elementId,
        });
        this.savePointRBush(spatialTree, pointRBush);
    }

    public static removeElement(
        spatialTree: WritableDraft<SpatialTree>,
        elementId: UUID,
        position: MapCoordinates | WritableDraft<MapCoordinates>
    ) {
        const pointRBush = this.getPointRBush(spatialTree);
        pointRBush.remove(
            {
                position,
                id: elementId,
            },
            (a, b) => a.id === b.id
        );
        this.savePointRBush(spatialTree, pointRBush);
    }

    public static moveElement(
        spatialTree: WritableDraft<SpatialTree>,
        elementId: UUID,
        startPosition: MapCoordinates | WritableDraft<MapCoordinates>,
        targetPosition: MapCoordinates
    ) {
        // TODO: use the move function from RBush, when available: https://github.com/mourner/rbush/issues/28
        this.removeElement(spatialTree, elementId, startPosition);
        this.addElement(spatialTree, elementId, targetPosition);
    }

    /**
     * @param circlePosition the middle point of the search-circle
     * @param radius of the search-circle
     *
     * @returns the ids of the elements in the search-circle, sorted by distance to {@link circlePosition}
     */
    public static findAllElementsInCircle(
        spatialTree: WritableDraft<SpatialTree>,
        circlePosition: MapCoordinates,
        radius: number
    ): UUID[] {
        // knn does not work great with `0`|`undefined` as it interprets either as `infinity`
        // knn also does not work great with negative numbers
        // see https://github.com/mourner/rbush-knn/blob/master/index.js line 15
        // TODO: Make it impossible to give this function a negative number
        if (radius <= 0) {
            return [];
        }
        // knn implements a k-nearest neighbors search for RBush (https://github.com/mourner/rbush-knn)
        return knn(
            this.getPointRBush(spatialTree),
            circlePosition.x,
            circlePosition.y,
            undefined,
            undefined,
            radius
        ).map(({ id }: PointRBushElement) => id);
    }

    // TODO: Use this to get all elements in a viewport
    /**
     * @returns all elements in the rectangle in a non-specified order
     */
    public static findAllElementsInRectangle(
        spatialTree: WritableDraft<SpatialTree>,
        topLeftPosition: MapCoordinates,
        size: Size
    ) {
        return this.getPointRBush(spatialTree).search({
            minX: topLeftPosition.x,
            minY: topLeftPosition.y,
            maxX: topLeftPosition.x + size.width,
            maxY: topLeftPosition.y + size.height,
        });
    }
}

/**
 * An element that is saved in the RBush
 * @param position of the element
 * @param id of the element
 */
interface PointRBushElement {
    position: MapCoordinates;
    id: UUID;
}

/**
 * An RBush that works with our {@link MapCoordinates} format (elements being points)
 * @see https://github.com/mourner/rbush#data-format
 */
class PointRBush extends RBush<PointRBushElement> {
    override toBBox(element: PointRBushElement) {
        return {
            minX: element.position.x,
            minY: element.position.y,
            maxX: element.position.x,
            maxY: element.position.y,
        };
    }
    override compareMinX(a: PointRBushElement, b: PointRBushElement) {
        return a.position.x - b.position.x;
    }
    override compareMinY(a: PointRBushElement, b: PointRBushElement) {
        return a.position.y - b.position.y;
    }
}
