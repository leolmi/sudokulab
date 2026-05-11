## L'idea: evitare il "deadly pattern"

Consideriamo quattro celle **ai vertici di un rettangolo**: due righe, due colonne, distribuite in esattamente due quadrati (cioè le due righe stanno nella stessa "banda" di 3 righe, e le colonne nella stessa banda di 3 colonne). Se tutte e quattro queste celle avessero gli stessi due candidati **{X, Y}**, la soluzione del puzzle non sarebbe unica: i due valori potrebbero scambiarsi tra i vertici generando _almeno due_ soluzioni valide (il cosiddetto _deadly pattern_).

Dato che SudokuLab lavora su schemi garantiti a soluzione unica, il deadly pattern è impossibile: ogni volta che siamo a un passo dal crearlo, uno dei vertici deve _necessariamente_ assumere un valore diverso da X o Y. Questa osservazione è ciò che Unique Rectangle sfrutta per rimuovere candidati.

## Tipo 1 — tre celle sono {X, Y}, la quarta ha "extra"

Se in un rettangolo **tre** vertici hanno esattamente {X, Y} e il **quarto** vertice ha {X, Y} più uno o più candidati "extra", allora quel quarto vertice non può finire a X né a Y (altrimenti si formerebbe il deadly pattern). Quindi da quel vertice **si rimuovono entrambi i candidati X e Y** e restano solo gli extra.

## Tipo 2 — due celle sono {X, Y}, due hanno {X, Y, Z}

Se due vertici opposti di una riga sono bivalore {X, Y} e gli altri due (sull'altra riga) hanno _identici_ candidati {X, Y, Z}, allora Z dovrà per forza occupare uno dei due vertici "estesi" (per rompere il deadly pattern). Di conseguenza **Z può essere rimosso da tutte le celle che vedono contemporaneamente quei due vertici estesi**.

## Esempio — Unique Rectangle Tipo 1 su {1, 3}

> Stato al passo in cui il solver applica Unique Rectangle. I quattro vertici del rettangolo sono **A3**, **A6**, **C3**, **C6** (righe A e C × colonne 3 e 6, distribuiti su quadrato 1 e quadrato 2 — due box). Tre di loro — **A3**, **C3**, **C6** (in primario) — hanno esattamente candidati {1, 3}. Il quarto vertice **A6** (in secondario) ha candidati {1, 3, 4}: l'"extra" è 4.

::board[example_1]

> Se A6 fosse 1 o 3, le quattro celle avrebbero tutte {1, 3} e i due valori si potrebbero scambiare lungo il rettangolo producendo due soluzioni. Visto che il puzzle ha soluzione unica, A6 _deve_ essere l'extra: da A6 vengono rimossi **1 e 3**, lasciando un naked single {4} che il passo successivo valorizzerà.

## Vincoli da rispettare

- Le 4 celle devono stare su **2 righe × 2 colonne** e in **esattamente 2 quadrati** (uno contenente le due celle di una coppia di colonne, l'altro le due celle dell'altra coppia). Se stessero in 4 quadrati diversi il vincolo di uniqueness non si propagherebbe.
- L'algoritmo è valido _solo_ se lo schema ha soluzione unica. In SudokuLab tutti gli schemi del catalogo lo sono, ma su schemi di provenienza incerta questa tecnica va usata con cautela.
