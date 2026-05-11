## Quando si applica

Si sceglie un gruppo (una **riga**, una **colonna** o un **quadrato**) e un valore **V** che ancora manca nel gruppo. Se, scorrendo tutte le celle vuote del gruppo, **una sola** può effettivamente contenere V — perché nelle altre V è già presente sulla loro riga, sulla loro colonna o nel loro quadrato — allora in quella cella si può piazzare V.

È la tecnica più immediata: non richiede di ragionare sui candidati della singola cella, ma solo di contare dove un certo valore può ancora finire dentro un gruppo.

## Esempio — valore 7 in riga B

> Nella riga **B** il valore 7 manca ancora. Le celle vuote sono **B2**, **B3**, **B5** e **B6**: tre di esse (_evidenziate in secondario_) hanno il 7 già bloccato dalla loro colonna o dal loro quadrato. Resta soltanto **B3** (_primario_), dove il 7 può essere piazzato.

::board[example_1]

> In dettaglio: in **B2** il 7 è escluso dalla colonna 2 (F2 contiene già 7); in **B5** il 7 è escluso dal quadrato centrale (C6 contiene già 7); in **B6** il 7 è escluso dalla colonna 6 (C6 contiene già 7). Quindi B3 è l'unica posizione possibile.

## Perché funziona

Ogni gruppo del sudoku deve contenere tutti i valori da 1 a 9 esattamente una volta. Se in un gruppo un valore può stare solo in una cella, quella cella **deve** contenerlo: non c'è altra collocazione possibile.
