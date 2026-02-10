import type { ImageProperties } from 'fuesim-digital-shared';
import { normalZoom } from 'fuesim-digital-shared';
import type { Feature } from 'ol';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import { StyleHelper } from './style-helper';

export class ImageStyleHelper extends StyleHelper<Style, Feature> {
    /**
     * If the zoom is higher than this value vector images will be rasterized to improve performance
     */
    private readonly rasterizeZoomThreshold = 0.1;

    constructor(
        private readonly getImageProperties: (
            feature: Feature
        ) => ImageProperties & {
            rotation?: number;
        }
    ) {
        super();
    }

    protected generateInitialStyle(feature: Feature, zoom: number) {
        const imageProperties = this.getImageProperties(feature);
        const rasterizeVectorImage = zoom > this.rasterizeZoomThreshold;
        return new Style({
            image: new Icon({
                src: imageProperties.url,
                // this is a workaround to force openLayers to rasterize an svg image
                // this gives a massive performance boost
                // See https://github.com/openlayers/openlayers/issues/11133#issuecomment-638987210
                color: rasterizeVectorImage ? 'white' : undefined,
                rotation: imageProperties.rotation,
            }),
        });
    }
    protected generateInitialStyleKey(feature: Feature, zoom: number) {
        const rasterizeVectorImage = zoom > this.rasterizeZoomThreshold;
        return JSON.stringify({
            imageProperties: this.getImageProperties(feature),
            rasterizeVectorImage,
        });
    }
    protected adjustStyleToZoom(
        initialStyle: Style,
        zoom: number,
        feature: Feature
    ) {
        const imageProperties = this.getImageProperties(feature);
        const imageStyle = initialStyle;
        imageStyle.setGeometry(feature.getGeometry()!);
        const image = imageStyle.getImage();

        if (!image) return imageStyle;

        const normalizedImageScale =
            // OpenLayers typings are not accurate
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            imageProperties.height / (image.getImageSize()?.[1] ?? 1);
        const newScale = normalizedImageScale / (zoom * normalZoom);
        if (image.getScale() !== newScale) {
            // Make sure the image is always the same size on the map
            image.setScale(newScale);
        }
        return imageStyle;
    }
}
