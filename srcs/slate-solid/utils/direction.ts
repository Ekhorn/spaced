/**
 * Source: https://github.com/wooorm/direction/blob/2318ba66f91ced488253441d9abdcf1748bee1f3/index.js
 *
 * (The MIT License)
 *
 * Copyright (c) 2014 Titus Wormer <tituswormer@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const rtlRange = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
const ltrRange =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6' +
  '\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C' +
  '\uFE00-\uFE6F\uFEFD-\uFFFF';

/* eslint-disable no-misleading-character-class */
const rtl = new RegExp('^[^' + ltrRange + ']*[' + rtlRange + ']');
const ltr = new RegExp('^[^' + rtlRange + ']*[' + ltrRange + ']');
/* eslint-enable no-misleading-character-class */

/**
 * Detect the direction of text: left-to-right, right-to-left, or neutral
 *
 * @param {string} value
 * @returns {'rtl'|'ltr'|'neutral'}
 */
export function getDirection(value: string) {
  const source = String(value || '');
  // eslint-disable-next-line unicorn/no-nested-ternary
  return rtl.test(source) ? 'rtl' : ltr.test(source) ? 'ltr' : 'neutral';
}
