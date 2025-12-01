import type { Feature } from 'ol';
import { Circle } from 'ol/style';
import type { Options } from 'ol/style/Circle';
import type ImageStyle from 'ol/style/Image';
import Style from 'ol/style/Style';
import { StyleHelper } from './style-helper';

export class CircleStyleHelper extends StyleHelper<Style, Feature> {
    /**
     *
     * @param getProperties returns the options for the circle that should be rendered
     * if `undefined` gets returned, no circle gets rendered (empty {@link Style}).
     */
    constructor(
        private readonly getProperties: (
            feature: Feature
        ) => Exclude<Options, { scale: any; displacement: any }> | undefined,
        // These two properties are zoom-dependent
        private readonly scale: number,
        private readonly getDisplacement: (feature: Feature) => [number, number]
    ) {
        super();
    }

    protected generateInitialStyle(feature: Feature, zoom: number) {
        const properties = this.getProperties(feature);
        if (properties === undefined) {
            return new Style();
        }
        return new Style({
            image: new Circle(properties),
        });
    }

    protected generateInitialStyleKey(feature: Feature, zoom: number) {
        return JSON.stringify(this.getProperties(feature));
    }

    protected adjustStyleToZoom(
        initialStyle: Style,
        zoom: number,
        feature: Feature
    ) {
        // The ol typings are wrong
        const image = initialStyle.getImage() as ImageStyle | null | undefined;
        // TODO: reuse these from `getProperties`
        image?.setScale(this.scale / zoom);
        image?.setDisplacement(
            this.getDisplacement(feature).map((a) => a / zoom)
        );
        return initialStyle;
    }
}
