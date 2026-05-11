/**
 * Parser markdown minimale, dedicato alle pagine di descrizione (algorithm-info
 * e affini, es. la pagina Infos).
 *
 * Subset supportato:
 *   - `# titolo`   → `<h2>` (`##` → `<h3>`, ecc.; l'`<h1>` resta alla shell)
 *   - paragrafi separati da riga vuota → `<p>`
 *   - `- item` / `* item` consecutivi → `<ul><li>…</li></ul>`
 *     con liste annidate via indentazione (2+ spazi prima del bullet)
 *   - `> testo`  → `<p class="caption">` (didascalia centrata in corsivo)
 *   - blocchi HTML grezzi: ogni riga che inizia con `<` apre un blocco
 *     che continua fino alla prima riga vuota (utile per `<ul class="…">`
 *     con icone inline, SVG, layout strutturati)
 *   - inline: `**bold**` → `<strong>`, `_em_` / `*em*` → `<em>`,
 *     `` `code` `` → `<code>`
 *   - inline placeholders `{name}` → sostituito con `params[name]`
 *   - immagini `![alt](src)` → `<img src="src" alt="alt" class="md-img">`
 *   - shortcode `::board[name]` su riga propria → blocco board (sample tipizzato)
 *   - shortcode `::slot[name]`  su riga propria → blocco slot (TemplateRef)
 *
 * L'output è un array di blocchi alternati: gli `html` finiscono in
 * `[innerHTML]`, i `board`/`slot` sono renderizzati dal componente shell.
 *
 * Scelte deliberate:
 *   - parser line-based, niente AST: leggibile a colpo d'occhio.
 *   - i caratteri `{` e `}` non hanno semantica markdown, quindi possono
 *     comparire direttamente nel testo (niente più `&#123;` / `&#125;`).
 *     I placeholder `{name}` matchano solo identificatori `\w+`, quindi
 *     non confliggono con notazioni tipo `{1, 2, 3}` o `{X, Y}`.
 */

export type MdBlock =
  | { kind: 'html'; html: string }
  | { kind: 'board'; name: string }
  | { kind: 'slot'; name: string };

const BOARD_RX = /^::board\[(\w+)\]\s*$/;
const SLOT_RX = /^::slot\[([\w-]+)\]\s*$/;
const HEADING_RX = /^(#{1,4})\s+(.+?)(?:\s*\{#([\w-]+)\})?\s*$/;
const LIST_RX = /^(\s*)[-*]\s+(.*)$/;
const QUOTE_RX = /^>\s+(.*)$/;
const PARAM_RX = /\{(\w+)\}/g;
const IMG_RX = /!\[([^\]]*)\]\(([^)]+)\)/g;

const isStructural = (line: string): boolean =>
  BOARD_RX.test(line) ||
  SLOT_RX.test(line) ||
  HEADING_RX.test(line) ||
  LIST_RX.test(line) ||
  QUOTE_RX.test(line) ||
  line.startsWith('<') ||
  line.trim() === '';

export type MdParams = Record<string, string | number>;

export function parseMarkdown(md: string, params?: MdParams): MdBlock[] {
  const out: MdBlock[] = [];
  const lines = md.split(/\r?\n/);
  let buf: string[] = [];
  const listStack: number[] = []; // indent counts of currently open <ul>

  const closeListsTo = (indent: number) => {
    while (listStack.length && listStack[listStack.length - 1] > indent) {
      buf.push('</ul>');
      listStack.pop();
    }
  };

  const closeAllLists = () => closeListsTo(-1);

  const flushHtml = () => {
    closeAllLists();
    if (buf.length > 0) {
      out.push({ kind: 'html', html: buf.join('') });
      buf = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const boardMatch = BOARD_RX.exec(line);
    if (boardMatch) {
      flushHtml();
      out.push({ kind: 'board', name: boardMatch[1] });
      continue;
    }

    const slotMatch = SLOT_RX.exec(line);
    if (slotMatch) {
      flushHtml();
      out.push({ kind: 'slot', name: slotMatch[1] });
      continue;
    }

    const headingMatch = HEADING_RX.exec(line);
    if (headingMatch) {
      closeAllLists();
      // `#` → h2, `##` → h3, `###` → h4 (lascia h1 alla shell esterna)
      const level = Math.min(headingMatch[1].length + 1, 6);
      const idAttr = headingMatch[3] ? ` id="${headingMatch[3]}"` : '';
      buf.push(`<h${level}${idAttr}>${inlineFmt(headingMatch[2], params)}</h${level}>`);
      continue;
    }

    const listMatch = LIST_RX.exec(line);
    if (listMatch) {
      const indent = listMatch[1].length;
      // chiudi i livelli più profondi se siamo "risaliti"
      closeListsTo(indent);
      // apri un nuovo livello se necessario
      if (listStack.length === 0 || listStack[listStack.length - 1] < indent) {
        buf.push('<ul>');
        listStack.push(indent);
      }
      buf.push(`<li>${inlineFmt(listMatch[2], params)}</li>`);
      continue;
    }

    closeAllLists();

    const quoteMatch = QUOTE_RX.exec(line);
    if (quoteMatch) {
      buf.push(`<p class="caption">${inlineFmt(quoteMatch[1], params)}</p>`);
      continue;
    }

    // blocco HTML grezzo: continua fino alla prima riga vuota o blocco strutturale
    if (line.startsWith('<')) {
      const htmlLines: string[] = [substParams(line, params)];
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim() !== '' &&
        !BOARD_RX.test(lines[i + 1]) &&
        !SLOT_RX.test(lines[i + 1])
      ) {
        i++;
        htmlLines.push(substParams(lines[i], params));
      }
      buf.push(htmlLines.join('\n'));
      continue;
    }

    if (line.trim() === '') continue;

    // accumula righe consecutive non strutturali come singolo paragrafo
    const paraLines: string[] = [line];
    while (i + 1 < lines.length && !isStructural(lines[i + 1])) {
      i++;
      paraLines.push(lines[i]);
    }
    buf.push(`<p>${inlineFmt(paraLines.join(' '), params)}</p>`);
  }

  flushHtml();
  return out;
}

/** Sostituisce i `{name}` con `params[name]` senza altre trasformazioni. */
function substParams(s: string, params?: MdParams): string {
  if (!params) return s;
  return s.replace(PARAM_RX, (m, name) => {
    const v = params[name];
    return v === undefined || v === null ? m : String(v);
  });
}

/**
 * Formattazione inline:
 *  1. code span protetti con placeholder (per non interferire con bold/em);
 *  2. immagini `![alt](src)` → `<img>` (prima di bold/em così l'alt non si rompe);
 *  3. `**bold**`, `_em_` / `*em*`;
 *  4. interpolazione `{name}` da `params` (alla fine: i valori non vengono
 *     riprocessati come markdown);
 *  5. ripristino dei code span.
 *
 * Le regex degli emphasis richiedono un bordo non alfanumerico per evitare
 * match dentro identificatori (es. `snake_case`).
 */
export function inlineFmt(s: string, params?: MdParams): string {
  const codes: string[] = [];
  const PH = ' CODE ';

  let r = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `${PH}${codes.length - 1}${PH}`;
  });

  r = r.replace(IMG_RX, (_, alt, src) => `<img src="${src}" alt="${alt}" class="md-img">`);

  r = r
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^A-Za-z0-9_])_([^_\n]+)_(?=[^A-Za-z0-9_]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[^*A-Za-z0-9_])\*([^*\n]+)\*(?=[^*A-Za-z0-9_]|$)/g, '$1<em>$2</em>');

  r = substParams(r, params);

  r = r.replace(new RegExp(`${PH}(\\d+)${PH}`, 'g'), (_, idx) => `<code>${codes[+idx]}</code>`);

  return r;
}
