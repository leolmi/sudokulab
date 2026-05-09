## DA FARE
- [ ] upgrade nx/angular to latest version;
- [ ] rifattorizzazione con Signal ed eliminazione di pipes e Observables su componenti;
 

## FATTI
- [x] controllo intelligente per inserimento valori in cella con visore circolare:
  - touch (o click) prolungati su cella aprono visore radiale con centro nella cella;
  - il visore contiene tutti i valori e quello per valore empty disposti a raggera;
  - senza togliere il touch (o il click) lo spostamento verso uno dei valori periferici 
    innesca la valorizzazione e la chiusura del visore;
