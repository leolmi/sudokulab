import { PrintPageEx, PrintTemplate, Sudoku } from '@olmi/model';
import { Type } from '@angular/core';
import { FourA4VComponent } from './fourA4V.component';
import { getBoardHtml, getFooterHtml, getHeaderHtml } from '../../templates.common';


const HTML_SECTION = `<section layout-row flex>@@SCHEMA_LEFT @@SCHEMA_RIGHT</section>`;
const HTML_SCHEMA_LEFT = `<div class="schema-container" flex><div class="schema">@@BOARD</div></div>@@INFO`;
const HTML_SCHEMA_RIGHT = `@@INFO<div class="schema-container right" flex><div class="schema">@@BOARD</div></div>`;

const HTML_SECTION_INFO = `<div class="schema-info-4s info-@@INFO_POSITION" layout-col>
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

const composeInfo = (sdk: Sudoku, position: 'top'|'bottom'): string => {
  let html = HTML_SECTION_INFO;
  html = html
    .replace('@@INFO_POSITION', position)
    .replace('@@NUMBERS', `${sdk.info.fixedCount}`);
  html = html
    .replace('@@TRYVALUE', (sdk.info.tryAlgorithmCount > 0) ? `<div class="info-num">T${sdk.info.tryAlgorithmCount}</div>` : '')
    .replace('@@DIFFICULTY', sdk.info.difficulty || '')
    .replace('@@DIFFVALUE', sdk.info.difficultyValue > 0 ? `${sdk.info.difficultyValue}` : '');
  return html;
}

const composeSection = (sdkLeft: Sudoku, sdkRight: Sudoku): string => {
  const boardLeft = getBoardHtml(sdkLeft);
  const infoLeft = composeInfo(sdkLeft, 'top');
  const schemaLeft = HTML_SCHEMA_LEFT
    .replace('@@BOARD', boardLeft)
    .replace('@@INFO', infoLeft);

  const boardRight = getBoardHtml(sdkRight);
  const infoRight = composeInfo(sdkRight, 'bottom');
  const schemaRight = HTML_SCHEMA_RIGHT
    .replace('@@BOARD', boardRight)
    .replace('@@INFO', infoRight);

  return HTML_SECTION
    .replace('@@SCHEMA_LEFT', schemaLeft)
    .replace('@@SCHEMA_RIGHT', schemaRight);
}


/**
 * template per la stampa con 2 griglie per pagina sovrapposte per una stampa verticale su A4
 */
export class PrintTemplateFourA4V extends PrintTemplate {
  name = 'Four-A4V';
  icon = 'grid_view';
  description = 'Four schemas per page';
  direction = 'vertical';
  size = 'A4';
  pagesForPage = 4;
  editor = <Type<any>>FourA4VComponent;

  compose = (page: PrintPageEx, last?: boolean) => {
    const htmls = [
      getHeaderHtml(),
      composeSection(page.sudokus[0], page.sudokus[1]),
      composeSection(page.sudokus[2], page.sudokus[3])];
    if (!last) htmls.push(getFooterHtml());
    return htmls.join('\n');
  }
}
