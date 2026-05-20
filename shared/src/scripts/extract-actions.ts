import 'reflect-metadata';

import { exerciseActionTypeDictionary } from '../store/action-reducers/action-reducers.js';

for (const [type, reducer] of Object.entries(exerciseActionTypeDictionary)) {
    console.log(type, ',');
}
