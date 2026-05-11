## Quando si applica

Si prende un gruppo (riga, colonna o quadrato) e si cercano **quattro valori** **W**, **X**, **Y** e **Z** che nel gruppo hanno complessivamente _solo quattro posizioni possibili_, ovvero quattro celle **c₁**, **c₂**, **c₃** e **c₄**. Nessun altro posto del gruppo può ospitare W, X, Y o Z: devono andare per forza lì.

Quelle quattro celle possono contenere **anche** altri candidati (ecco perché si dice "hidden"): non lo si vede direttamente guardando i candidati delle singole celle, bisogna ragionare sui valori e dove possono stare. Una volta individuato il pattern, i candidati diversi da W, X, Y, Z possono essere rimossi da c₁, c₂, c₃ e c₄.

È l'estensione diretta di _Hidden Triple_ a quattro valori: più raro, perché richiede di trovare contemporaneamente quattro cifre "compatte" nello stesso gruppo.

## Esempio — quaterna (1, 2, 3, 4) in riga A

> Nello stato qui sotto, nella **riga A** le cifre **1**, **2**, **3** e **4** possono stare _solo_ nelle celle **A1**, **A2**, **A3** e **A4** (in primario):

- l'1 è escluso dal quadrato in alto a destra (B7=1) e quindi da A7, A8, A9;
- il 2 è escluso dalla colonna 9 (B9=2) e dal quadrato in alto a destra, quindi da A7, A8, A9;
- il 3 è escluso dalla colonna 7 (C7=3) e dal quadrato in alto a destra, quindi da A7, A8, A9;
- il 4 è escluso dalla colonna 8 (C8=4) e dal quadrato in alto a destra, quindi da A7, A8, A9.

::board[example_1]

> A1, A2, A3 e A4 mostrano oggi i candidati {1, 2, 3, 4, 9}: i primi quattro sono il pattern nascosto, il 9 è un candidato "spurio" che va rimosso da tutte e quattro le celle. Dopo l'applicazione dell'algoritmo quelle quattro celle avranno candidati {1, 2, 3, 4}, diventando di fatto un naked quad: il passo successivo potrà quindi rimuovere 1, 2, 3 e 4 dalle altre celle della riga o di altri gruppi comuni alle quattro celle.

> _Nota didattica_: lo schema qui sotto è uno stato parziale costruito apposta per isolare il pattern. Nel catalogo dei puzzle reali di SudokuLab Hidden Quad non viene praticamente mai raggiunto, perché algoritmi più semplici (One Cell For Value, Twins, Naked Triple, Hidden Triple…) risolvono gli schemi prima che si arrivi a questo livello di concentrazione di candidati.

## Perché funziona

Ogni gruppo del sudoku contiene ciascuna cifra esattamente una volta. Se quattro cifre W, X, Y, Z possono finire solo in quattro celle comuni, la corrispondenza è obbligata: quelle quattro celle conterranno esattamente quelle quattro cifre (in un ordine qualsiasi). Nessun altro valore può quindi occuparle.

## Come riconoscerlo velocemente

Parti dai _valori_, non dalle celle. Per ogni gruppo conta in quante celle ciascuna cifra da 1 a 9 può ancora andare. Se quattro cifre hanno tutte la stessa ristretta rosa di 4 posizioni (o un sottoinsieme di essa), hai un hidden quad. Questa ricerca è quella che richiede più attenzione: conviene farla solo dopo aver esaurito naked subset e hidden triple.
