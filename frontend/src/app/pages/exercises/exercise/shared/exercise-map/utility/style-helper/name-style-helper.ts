import type { Feature } from 'ol';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import OlText from 'ol/style/Text';
import { StyleHelper } from './style-helper';

export class NameStyleHelper extends StyleHelper<Style, Feature> {
    constructor(
        private readonly getNameAndOffset: (feature: Feature) => {
            name: string;
            /**
             * This is often `image.height / 2 / normalZoom` if you want to display it under the image.
             */
            offsetY: number;
        },
        private readonly scale: number,
        private readonly textBaseline:
            | 'alphabetic'
            | 'bottom'
            | 'hanging'
            | 'ideographic'
            | 'middle'
            | 'top'
    ) {
        super();
    }

    protected generateInitialStyle(feature: Feature, zoom: number) {
        return new Style({
            text: new OlText({
                text: this.getNameAndOffset(feature).name,
                fill: new Fill({
                    color: '#f8f9fa',
                }),
                stroke: new Stroke({
                    color: 'black',
                }),
                textBaseline: this.textBaseline,
                overflow: true,
            }),
        });
    }

    protected generateInitialStyleKey(feature: Feature, zoom: number) {
        return JSON.stringify(this.getNameAndOffset(feature));
    }

    protected adjustStyleToZoom(
        initialStyle: Style,
        zoom: number,
        feature: Feature
    ) {
        const text = initialStyle.getText();

        if (!text) return initialStyle;

        text.setScale(this.scale / zoom);
        text.setOffsetY(this.getNameAndOffset(feature).offsetY / zoom);
        return initialStyle;
    }
}
