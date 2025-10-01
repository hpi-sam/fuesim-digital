import { IsInt, Min } from 'class-validator';
import { IsValue } from '../../../utils/validators/index.js';
import { getCreate } from '../../utils/get-create.js';
import type { RadiogramStatus } from './radiogram-status.js';

export class RadiogramDoneStatus implements RadiogramStatus {
    @IsValue('doneRadiogramStatus')
    public readonly type = 'doneRadiogramStatus';

    @IsInt()
    @Min(0)
    public readonly publishTime: number;

    /**
     * @deprecated Use {@link create} instead.
     */

    constructor(publishTime: number) {
        this.publishTime = publishTime;
    }

    static readonly create = getCreate(this);
}
