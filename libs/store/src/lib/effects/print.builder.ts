import { calcFixedCount, getFixedCount, getTryCount, PrintPage, Sudoku, SUDOKU_EMPTY_VALUE } from '@sudokulab/model';

const HTML_HEADER = `<header layout-row centered-left><div class="title" flex>Supena<span class="title-postfix">Lab</span></div></header>`;
const HTML_SECTION_LEFT = `<section layout-row flex><div class="schema-container" flex><div class="schema">@@BOARD</div></div>@@INFO</section>`;
const HTML_SECTION_RIGHT = `<section layout-row flex>@@INFO<div class="schema-container" flex><div class="schema">@@BOARD</div></div></section>`;
const HTML_FOOTER = `<div style="display:block;page-break-before:always;"></div>`;
const HTML_SECTION_INFO = `<div class="schema-info" layout-col>
      <div class="schema-info-line" layout-row>
        <div class="info-num">@@NUMBERS</div>
        @@TRYVALUE
      </div>
      <div class="schema-info-line" layout-row>
        <div flex layout-col>
          <div class="info-title">@@DIFFICULTY</div>
          <div class="info-sub-title">@@DIFFVALUE</div>
        </div>
      </div>
    </div>`;
const HTML_BOARD = `<svg class="board" viewBox="0 0 90 90">
    <g>
      <rect x="10" y="0" width="10" height="90" stroke="#999" fill="transparent" stroke-width=".1"></rect>
      <rect x="40" y="0" width="10" height="90" stroke="#999" fill="transparent" stroke-width=".1"></rect>
      <rect x="70" y="0" width="10" height="90" stroke="#999" fill="transparent" stroke-width=".1"></rect>
      <rect x="0" y="10" width="90" height="10" stroke="#999" fill="transparent" stroke-width=".1"></rect>
      <rect x="0" y="40" width="90" height="10" stroke="#999" fill="transparent" stroke-width=".1"></rect>
      <rect x="0" y="70" width="90" height="10" stroke="#999" fill="transparent" stroke-width=".1"></rect>
      <rect x="0" y="0" width="90" height="90" stroke="#111" fill="transparent" stroke-width=".5"></rect>
      <rect x="30" y="0" width="30" height="90" stroke="#111" fill="transparent" stroke-width=".5"></rect>
      <rect x="0" y="30" width="90" height="30" stroke="#111" fill="transparent" stroke-width=".5"></rect>
      @@VALUES
    </g>
  </svg>`;
const HTML_BOARD_VALUE = `<text class="board-text" x="@@VALX" y="@@VALY">@@VALUE</text>`

const TEXT_OFFSET = {
  x: 3,
  y: 2.4
}

const composeInfo = (sdk: Sudoku): string => {
  let html = HTML_SECTION_INFO;
  const numbers = calcFixedCount(sdk.fixed);
  html = html.replace('@@NUMBERS', `${numbers}`);
  const trynum = getTryCount(sdk);
  html = html
    .replace('@@TRYVALUE', (trynum > 0) ? `<div class="info-num">T${trynum}</div>` : '')
    .replace('@@DIFFICULTY', sdk.info?.difficulty || '')
    .replace('@@DIFFVALUE', sdk.info?.difficultyValue > 0 ? `${sdk.info.difficultyValue}` : '');
  return html;
}

const composeValues = (sdk: Sudoku): string => {
  const rank = sdk?.rank || 9;
  const dim = rank * rank;
  let values = '';
  for (let i = 0; i < dim; i++) {
    const row = Math.floor(i / rank);
    const col = (i % rank);
    const value = (sdk?.values||'').charAt(i);
    if (!!value && value !== SUDOKU_EMPTY_VALUE) {
      const html_value = HTML_BOARD_VALUE
        .replace('@@VALUE', value)
        .replace('@@VALX', `${ (col * 10) + TEXT_OFFSET.x }`)
        .replace('@@VALY', `${ ((row+1) * 10) - TEXT_OFFSET.y }`)
      values = [values, html_value].join('\n');
    }
  }
  return values;
}

const composeSection = (sdk: Sudoku, left = true): string => {
  let html = left ? HTML_SECTION_LEFT : HTML_SECTION_RIGHT;
  let values = composeValues(sdk);
  let board = HTML_BOARD.replace('@@VALUES', values);
  html = html.replace('@@BOARD', board);
  const info = composeInfo(sdk);
  html = html.replace('@@INFO', info);
  return html;
}

export const composePage = (p: PrintPage, last?: boolean): string => {
  let html = HTML_HEADER;
  let sdk = p.schema['top'];
  if (!!sdk) html = [html ,composeSection(sdk)].join('\n');
  sdk = p.schema['bottom'];
  if (!!sdk) html = [html ,composeSection(sdk, false)].join('\n');
  if (!last) html = [html , HTML_FOOTER].join('\n');
  return html;
}
