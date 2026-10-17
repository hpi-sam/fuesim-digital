import type { MeasureTemplate } from 'fuesim-digital-shared';

export type MeasureTemplateDragData =
    | {
          source: 'categorized';
          categoryName: string;
          template: MeasureTemplate;
      }
    | { source: 'blueprint'; template: MeasureTemplate };

export function isMeasureTemplateDragData(
    data: unknown
): data is MeasureTemplateDragData {
    return (
        typeof data === 'object' &&
        data !== null &&
        'source' in data &&
        (data.source === 'blueprint' || data.source === 'categorized')
    );
}
