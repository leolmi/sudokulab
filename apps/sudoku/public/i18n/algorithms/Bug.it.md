## L'idea — la "bi-value grave"

Immagina uno schema in cui **tutte** le celle ancora da valorizzare sono _bi-valore_ (hanno esattamente 2 candidati) e in cui **ogni valore** compare in _esattamente 2 celle_ di ogni gruppo (riga, colonna, quadrato). Questa configurazione si chiama **bi-value universal grave**: comunque si scelga un valore per una cella, il suo "gemello" nel gruppo prende l'altro. Il problema è che una seconda scelta invertita produrrebbe una seconda soluzione altrettanto valida.

Se lo schema ha soluzione _unica_ (come in SudokuLab) la bi-value grave non può essere raggiunta: deve esserci _almeno una_ cella con 3 candidati che "rompe" la simmetria e scardina la doppia soluzione.

## Quando si applica

Nello stato corrente valgono tutte queste condizioni:

- tutte le celle vuote tranne una hanno **2 candidati**;
- una _sola_ cella — chiamiamola **T** — ha **3 candidati**;
- per uno dei tre candidati **V**, in _ogni gruppo_ (riga/colonna/quadrato) a cui **T** appartiene, V è presente come candidato _esattamente 2 volte_.

Se T valesse V, tutti i gruppi di T avrebbero V piazzato localmente e il resto della griglia ricadrebbe esattamente in una bi-value grave — cioè in uno schema a doppia soluzione. Impossibile, dunque **V può essere rimosso dai candidati di T**. Se il trivalente resta con 2 candidati utili, il passo successivo (spesso un naked pair/single) chiude il puzzle.

## Esempio — BUG+1 sulla cella D9

> Stato al passo in cui il solver applica BUG. Nella griglia ci sono 18 celle ancora vuote: tutte hanno 2 candidati tranne **D9** (in primario) che ne ha 3 — {1, 6, 9}. Il valore 1 è presente esattamente due volte in ciascuno dei tre gruppi di D9:

- riga D: {1} in **D3**, D9;
- colonna 9: {1} in D9, **F9**;
- quadrato in basso a destra di D9: {1} in D9, F9.

> Le due celle "testimone" del pattern (D3 e F9, in secondario) sono quelle con cui D9 forma le coppie da 2 occorrenze.

::board[example_1]

> Se D9 fosse 1, allora D3 e F9 diventerebbero automaticamente non-1 e lo schema collasserebbe in una bi-value grave a doppia soluzione. Poiché lo schema ha soluzione unica, **1** viene rimosso da D9 che resta con {6, 9}.

## Quando ha senso cercarlo

BUG è una tecnica _endgame_: non può applicarsi su uno schema poco riempito perché richiede che tutte le celle vuote tranne una siano bi-valore. Il solver di SudokuLab lo pesa con `NP` (percentuale di celle già piazzate), proprio perché è rilevante solo nella fase finale.
