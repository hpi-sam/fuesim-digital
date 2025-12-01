import { logToStringPipeTransform } from './log-to-string-pipe-transform';

describe('LogToStringPipe', () => {
    it('converts strings correctly', () => {
        const aString = 'abcdefg ghijklmn opqrstuvw';
        expect(logToStringPipeTransform(aString)).toEqual(aString);
    });

    it('converts numbers correctly', () => {
        const aNumber = 1234.45;
        expect(logToStringPipeTransform(aNumber)).toEqual('1234.45');
    });

    it('converts boolean correctly', () => {
        const aBoolean = true;
        expect(logToStringPipeTransform(aBoolean)).toEqual('true');
    });

    it('converts function correctly', () => {
        const aFunction = () => 42;
        expect(logToStringPipeTransform(aFunction)).toEqual('function');
    });

    it('converts undefined correctly', () => {
        const anUndefined = undefined;
        expect(logToStringPipeTransform(anUndefined)).toEqual(null);
    });

    it('converts bigint correctly', () => {
        const aBigInt = BigInt('0x1fffffffffffff');
        expect(logToStringPipeTransform(aBigInt)).toEqual('9007199254740991');
    });

    it('convert fails when value is not convertible', () => {
        const anIllegalValue = { bigValue: BigInt('0x1fffffffffffff') };
        expect(logToStringPipeTransform(anIllegalValue)).toEqual(
            'Not able to display the Log-object.'
        );
    });

    it('converts objects correctly', () => {
        const anObject = {
            a: 123,
            b: 'asde',
        };
        expect(logToStringPipeTransform(anObject)).toEqual(`{
  "a": 123,
  "b": "asde"
}`);
    });

    it('converts objects with functions correctly', () => {
        const anObject = {
            a: 123,
            b: 'asde',
            c: () => 223,
        };
        expect(logToStringPipeTransform(anObject)).toEqual(`{
  "a": 123,
  "b": "asde"
}`);
    });

    it('treats line breaks in strings correctly', () => {
        const aStringWithLineBreaks = `0
1\n2\n
3
4`;
        expect(logToStringPipeTransform(aStringWithLineBreaks)).toEqual(
            `0
1
2

3
4`
        );
        const anObjectWithLineBreaks = {
            b: aStringWithLineBreaks,
        };
        expect(logToStringPipeTransform(anObjectWithLineBreaks)).toEqual(
            `{
  "b": "0
1
2

3
4"
}`
        );
    });

    it('correctly handles cyclic references', () => {
        const obj = {} as any;
        obj.property = obj;
        expect(logToStringPipeTransform(obj)).toContain('CYCLIC REFERENCE');
    });
});
