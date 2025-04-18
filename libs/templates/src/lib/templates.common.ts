import { buildSudokuCells, Sudoku } from '@olmi/model';
const HTML_HEADER = `<header layout-row centered-left><div class="title" flex>Supena<span class="title-postfix">Lab</span></div></header>`;
const HTML_FOOTER = `<div style="display:block;page-break-before:always;"></div>`;
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

const composeValues = (sdk: Sudoku): string => {
  let values = '';
  buildSudokuCells(sdk.values)
    .forEach(cell => {
      if (cell.text) {
        const html_value = HTML_BOARD_VALUE
          .replace('@@VALUE', cell.text)
          .replace('@@VALX', `${(cell.col * 10) + TEXT_OFFSET.x}`)
          .replace('@@VALY', `${((cell.row + 1) * 10) - TEXT_OFFSET.y}`)
        values = `${values}\n${html_value}`;
      }
    });
  return values;
}

export interface BoardHtmlOptions {
  pencilFrame?: boolean;
  coords?: boolean;
}

/**
 * crea lo schema con i valori
 * @param sdk
 * @param o
 */
export const getBoardHtml = (sdk: Sudoku, o?: BoardHtmlOptions) => {
  let values = composeValues(sdk);
  return HTML_BOARD.replace('@@VALUES', values);
}

export const getHeaderHtml = () => HTML_HEADER;
export const getFooterHtml = () => HTML_FOOTER;
