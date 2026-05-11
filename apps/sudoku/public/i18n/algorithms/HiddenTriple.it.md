## Quando si applica

Si prende un gruppo (riga, colonna o quadrato) e si cercano **tre valori** **X**, **Y** e **Z** che nel gruppo hanno complessivamente _solo tre posizioni possibili_, ovvero tre celle **c₁**, **c₂** e **c₃**. Nessun altro posto del gruppo può ospitare X, Y o Z: devono andare per forza lì.

Quelle tre celle possono contenere **anche** altri candidati (ecco perché si dice "hidden"): non lo si vede direttamente guardando i candidati delle singole celle, bisogna ragionare sui valori e dove possono stare. Una volta individuato il pattern, i candidati diversi da X, Y, Z possono essere rimossi da c₁, c₂ e c₃.

## Esempio — terna (1, 2, 3) in riga A

> Nello stato qui sotto, nella **riga A** le cifre **1**, **2** e **3** possono stare _solo_ nelle celle **A1**, **A2** e **A3** (in primario): in A8 e A9 il 1 è escluso dalla colonna 8 (B8=1), il 2 è escluso dalla colonna 9 (B9=2) e il 3 è escluso dal quadrato in alto a destra (C7=3). Restano come posizioni libere solo le prime tre celle.

::board[example_1]

> A1, A2 e A3 mostrano oggi i candidati {1, 2, 3, 8, 9}: i primi tre sono il pattern nascosto, gli altri (8 e 9) vanno rimossi. Dopo l'applicazione dell'algoritmo quelle tre celle avranno candidati {1, 2, 3}, diventando di fatto un naked triple: il passo successivo potrà quindi rimuovere 1, 2 e 3 dalle altre celle della riga (o di altri gruppi comuni alle tre celle).

> _Nota didattica_: lo schema qui sotto è uno stato parziale costruito apposta per isolare il pattern. Nel catalogo dei puzzle reali di SudokuLab Hidden Triple non viene di norma raggiunto, perché algoritmi più semplici (One Cell For Value, Twins, Naked Triple…) risolvono gli schemi prima che si arrivi a questo livello.

## Perché funziona

Ogni gruppo del sudoku contiene ciascuna cifra esattamente una volta. Se tre cifre X, Y, Z possono finire solo in tre celle comuni, la corrispondenza è obbligata: quelle tre celle conterranno esattamente quelle tre cifre (in un ordine qualsiasi). Nessun altro valore può quindi occuparle.
