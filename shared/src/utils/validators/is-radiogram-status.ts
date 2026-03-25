import { Type } from 'class-transformer';
import { radiogramStatusTypeOptions } from '../../models/radiogram/status/exercise-radiogram-status.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function IsRadiogramStatus() {
    return Type(...radiogramStatusTypeOptions);
}
