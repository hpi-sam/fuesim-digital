import { IsString, IsUUID } from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import type { ImageProperties } from './utils/index.js';
import { getCreate, imagePropertiesSchema } from './utils/index.js';

export class MapImageTemplate {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('mapImageTemplate' as const)
    public readonly type = 'mapImageTemplate';

    @IsString()
    public readonly name: string;

    @IsZodSchema(imagePropertiesSchema)
    public readonly image: ImageProperties;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(name: string, image: ImageProperties) {
        this.name = name;
        this.image = image;
    }

    static readonly create = getCreate(this);
}
