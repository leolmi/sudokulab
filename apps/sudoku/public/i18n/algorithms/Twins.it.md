## Quando si applica

Si prende un gruppo (riga, colonna o quadrato) e una coppia di valori **X** e **Y**. Se nel gruppo **sia X che Y** possono stare solo nelle stesse due celle — nessun'altra posizione del gruppo ammette né X né Y — allora quelle due celle _sono i gemelli_: devono contenere esattamente X e Y.

Conseguenze (in SudokuLab applicate nello stesso passo):

- dalle **due celle gemelle** si possono rimuovere tutti i candidati diversi da X e Y;
- dalle **altre celle** di ogni gruppo che contiene entrambi i gemelli (riga, colonna o quadrato comune) si possono rimuovere X e Y, se presenti.

## Esempio — coppia (6, 7) in riga D

> Nella riga **D** i valori **6** e **7** possono comparire solo in **D2** e **D4** (evidenziate in primario). Oggi quelle celle contengono anche altri candidati — D2 ha {2, 4, 6, 7} e D4 ha {2, 6, 7, 8} — ma siccome 6 e 7 devono andare per forza lì, gli altri candidati di D2 e D4 diventano impossibili.

::board[example_1]

> Dopo l'applicazione dell'algoritmo D2 e D4 restano con i soli candidati {6, 7}. Inoltre, se in altre celle di riga D (o di ogni altro gruppo comune ai gemelli) comparissero ancora 6 o 7, si potrebbero rimuovere: qui non serve perché 6 e 7 già non sono candidati altrove in riga D.

## Perché funziona

Ogni gruppo del sudoku contiene ogni cifra 1–9 esattamente una volta. Se X e Y possono stare _solo_ in due celle di un gruppo, quelle due celle devono ospitare X e Y (non esiste altra collocazione). Nessun altro valore può quindi occuparle, e X/Y non possono finire in altre celle che dividano un gruppo con entrambi i gemelli.
