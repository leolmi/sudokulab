## TODO

- [x] navigare nella lista degli step di risoluzione applicando le modifiche ai valori possibili per cella;
- [x] template di stampa a 4 aree;

<br>

- [ ] opzionabilità degli algoritmi utilizzati nel risolutore;
- [ ] algoritmi: implementare popup con help per ogni algoritmo con esempio
      predefinito o applicato allo schema attuale;
- [ ] player di highligths per animazioni. Nuove words:
  - strutturali:
    - `label`: scrive testo: 
      ````
      label {text}:{position}:{color}
      ````
    - `path`: genera percorsi lineari da cella a cella:
      ````
      path {cell1}[,{cell2}[,...]]:{color}
      ````
  - dispositive
    - `clear`: elimina tutti gli highlights attivi
      ````
      clear
      ````
    - `pause`: aspetta tempo o interazione utente
      ````
      pause {milliseconds|input}
      ````      
    - `value`: valorizza cella o modifica i valori possibili
      ````
      value {target1=value1}[,{target2=value2}[,...]]
      ````
    - `option`: imposta un'opzione temporanea (solo per l'animazione) per la griglia
      ````
      option {option}:{value}
      ````
- [ ] generare highlights come animazioni dalla soluzione dello schema
- [ ] (50%) aggiornare la pagina infos;
- [ ] keeper x immagini;
  - selezionare quadrilatero su immagine indicando i vertici;
  - distorsione immagine > quadrato;
  - scala di grigi > luminosità > contrasto;
  - rilevazione delle celle
  - interpretazione carattere in cella
  - restituzione stringa dello schema

- [ ] gioco a tempo (nelle pause diventa "blurizzato")
