import type {
    OperationsMapProperties,
    TileMapProperties,
} from '../../models/index.js';

export const defaultTileMapProperties: TileMapProperties = {
    tileUrl:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 20,
};

export const defaultOperationsMapProperties: OperationsMapProperties = {
    tileUrl:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dataUrl: 'https://tiles.openfreemap.org/planet',
    enable3dBuildings: true,
};
