// adapted from https://github.com/markdown-it/markdown-it-container

/**
 * Copyright (c) 2015 Vitaly Puzrin, Alex Kocharin.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

const marker_str = ':';
const marker_char = marker_str.charCodeAt(0);
module.exports = function container_plugin(md, name) {
  function container(state, startLine, endLine) {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    // Check for the starter
    //
    if (marker_char !== state.src.charCodeAt(start)) { return false; }

    const markup = state.src.slice(start, start + 1);
    const params = state.src.slice(start + 1, max);

    // Search for the end of the block
    let minIndent = state.tShift[startLine] + 1;
    let minIndentSet = false;
    const lines = [];
    let nextLine = startLine + 1;
    for (
      ;
      (
        nextLine < endLine &&
        (
          state.bMarks[nextLine] === state.eMarks[nextLine] || // blank line
          state.tShift[nextLine] >= minIndent
        )
      );
      nextLine++
    ) {
      if (state.bMarks[nextLine] === state.eMarks[nextLine]) {
        lines.push('');
      } else {
        if (!minIndentSet) {
          minIndent = state.tShift[nextLine];
          minIndentSet = true;
        }
        lines.push(
          state.src.slice(
            state.bMarks[nextLine] + minIndent,
            state.eMarks[nextLine],
          ),
        );
      }
    }

    const token = state.push('container_' + name, 'div', 0);
    token.markup = markup;
    token.block = true;
    token.info = {title: params, body: lines};
    token.map = [startLine, nextLine];

    state.line = nextLine;

    return true;
  }

  md.block.ruler.before('fence', 'container_' + name, container, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
};
