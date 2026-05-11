## Quando si applica

Consideriamo un valore **V**. X-Wings vede il pattern quando:

- in **due righe** diverse V può stare in _esattamente_ due celle;
- le due posizioni nelle due righe si trovano sulle **stesse due colonne**.

Le quattro celle formano un rettangolo ("X-Wing"). Poiché V deve stare in entrambe le righe e solo in quelle due colonne, V non può comparire in nessun'altra cella di quelle colonne.

## Esempio — X-Wing per il valore 1

> Stato dello schema al passo in cui il solver applica l'algoritmo. Il candidato **1** è confinato a due sole celle in **colonna 3** (D3, I3) e a due sole celle in **colonna 4** (D4, I4). Le quattro celle, evidenziate in primario, sono allineate sulle stesse due righe (D e I) e formano il rettangolo dell'X-Wing. La cella in secondario (**D5**) è quella su cui il solver, per effetto dell'algoritmo, rimuove il candidato 1.

::board[example_1]

> Dato il pattern, il valore 1 può essere **eliminato** da ogni altra cella delle righe **D** e **I**: in quelle righe l'1 può finire solo in uno dei quattro vertici del rettangolo.

## Perché funziona

Le colonne 3 e 4 devono ciascuna contenere un 1. Se entrambe lo hanno solo nelle righe D e I, una delle due colonne prende l'1 in riga D e l'altra in riga I (sono le uniche due combinazioni possibili). In ogni caso le righe D e I contengono già i loro 1 nei vertici, quindi non possono contenerne altri.
