import { DEFAULT_PRINT_TEMPLATE, PrintPageEx, PrintTemplate, Sudoku } from '@olmi/model';
import { Type } from '@angular/core';
import { CoupleA4VComponent } from './coupleA4V.component';
import { getBoardHtml, getFooterHtml, getHeaderHtml } from '../../templates.common';

const HTML_SECTION_LEFT = `<section layout-row flex><div class="schema-container" flex><div class="schema">@@BOARD</div></div>@@INFO</section>`;
const HTML_SECTION_RIGHT = `<section layout-row flex>@@INFO<div class="schema-container" flex><div class="schema">@@BOARD</div></div></section>`;
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

const composeInfo = (sdk: Sudoku): string => {
  let html = HTML_SECTION_INFO;
  html = html.replace('@@NUMBERS', `${sdk.info.fixedCount}`);
  html = html
    .replace('@@TRYVALUE', (sdk.info.tryAlgorithmCount > 0) ? `<div class="info-num">T${sdk.info.tryAlgorithmCount}</div>` : '')
    .replace('@@DIFFICULTY', sdk.info.difficulty || '')
    .replace('@@DIFFVALUE', sdk.info.difficultyValue > 0 ? `${sdk.info.difficultyValue}` : '');
  return html;
}

const composeSection = (sdk: Sudoku, left = true): string => {
  let html = left ? HTML_SECTION_LEFT : HTML_SECTION_RIGHT;
  const board = getBoardHtml(sdk);
  html = html.replace('@@BOARD', board);
  const info = composeInfo(sdk);
  html = html.replace('@@INFO', info);
  return html;
}

/**
 * template per la stampa con 2 griglie per pagina sovrapposte per una stampa verticale su A4
 */
export class PrintTemplateCoupleA4V extends PrintTemplate {
  name = DEFAULT_PRINT_TEMPLATE;
  icon = 'view_agenda';
  description = 'Two schemas per page one above the other';
  direction = 'vertical';
  size = 'A4';
  pagesForPage = 2;
  editor = <Type<any>>CoupleA4VComponent;

  compose = (page: PrintPageEx, last?: boolean) => {
    let html = getHeaderHtml();
    let sdk =  page.sudokus[0];
    if (!!sdk) html = [html, composeSection(sdk)].join('\n');
    sdk = page.sudokus[1];
    if (!!sdk) html = [html ,composeSection(sdk, false)].join('\n');
    if (!last) html = [html , getFooterHtml()].join('\n');
    return html;
  }
}
