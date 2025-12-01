import { calculatePopupPositioning } from './calculate-popup-positioning';

const defaultViewCenter = [2, 2];
const defaultConstraints = { width: 1, height: 1 };

describe('CalculatePopupPositioning', () => {
    it('returns top popup positioning, if feature is in bottom half', () => {
        expect(
            calculatePopupPositioning(
                [1, 1],
                defaultConstraints,
                defaultViewCenter
            ).positioning
        ).toEqual('bottom-center');

        expect(
            calculatePopupPositioning(
                [3, 1],
                defaultConstraints,
                defaultViewCenter
            ).positioning
        ).toEqual('bottom-center');
    });

    it('returns bottom popup positioning, if feature is in top half and not close to the sides', () => {
        expect(
            calculatePopupPositioning(
                [1.5, 3],
                defaultConstraints,
                defaultViewCenter
            ).positioning
        ).toEqual('top-center');

        expect(
            calculatePopupPositioning(
                [2.5, 3],
                defaultConstraints,
                defaultViewCenter
            ).positioning
        ).toEqual('top-center');
    });

    it('returns left or right popup positioning, if feature is in top half and close to the sides', () => {
        expect(
            calculatePopupPositioning(
                [0.5, 3],
                defaultConstraints,
                defaultViewCenter
            ).positioning
        ).toEqual('center-left');

        expect(
            calculatePopupPositioning(
                [3.5, 3],
                defaultConstraints,
                defaultViewCenter
            ).positioning
        ).toEqual('center-right');
    });

    it('applies constraints to position', () => {
        expect(
            calculatePopupPositioning(
                [1, 1],
                defaultConstraints,
                defaultViewCenter
            ).position
        ).toStrictEqual([1, 1.5]);

        expect(
            calculatePopupPositioning(
                [4, 3],
                defaultConstraints,
                defaultViewCenter
            ).position
        ).toStrictEqual([3.5, 3]);
    });

    it('works for different viewCenter and constraints', () => {
        expect(
            calculatePopupPositioning([4, 6], { width: 9, height: 5 }, [3, 7])
        ).toStrictEqual({
            position: [4, 8.5],
            positioning: 'bottom-center',
        });
    });
});
