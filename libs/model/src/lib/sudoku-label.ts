export class SudokuLabel {
  constructor(l?: Partial<SudokuLabel>) {
    this.text = l?.text||'';
    this.position = l?.position||'center';
    this.color = l?.color||'';
  }

  /**
   * testo
   */
  text: string;
  /**
   * posizione
   */
  position: 'top'|'center'|'bottom';
  /**
   * colore
   */
  color: string;
}
