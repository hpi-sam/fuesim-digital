import { IsInt, Min } from 'class-validator';
import { IsLiteralUnion } from '../../utils/validators/is-literal-union.js';
import { currentStateVersion } from '../../state.js';

export abstract class BaseExportImportFile {
    public static readonly currentFileVersion = 1;

    @IsInt()
    @Min(0)
    public readonly fileVersion: number =
        BaseExportImportFile.currentFileVersion;

    @IsInt()
    @Min(0)
    public readonly dataVersion: number = currentStateVersion;

    @IsLiteralUnion({
        complete: true,
        partial: true,
    })
    public abstract readonly type: 'complete' | 'partial';
}
