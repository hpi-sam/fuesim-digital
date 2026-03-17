import type { TileMapProperties } from '../../models/index.js';

export const defaultTileMapProperties: TileMapProperties = {
    tileUrl:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 20,
};
