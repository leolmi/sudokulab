## Quando si applica

Try Number interviene **solo come ultima risorsa**, quando nessun altro algoritmo logico del catalogo produce più progressi sullo stato corrente. È l'equivalente strutturato del "prova e vedi" manuale: si sceglie una cella, si _diramano_ N schemi paralleli (uno per candidato) e si prosegue con la risoluzione su ciascun ramo. I rami incompatibili con i vincoli si auto-eliminano in errore; il ramo che si completa senza contraddizioni contiene la soluzione.

Per questo motivo Try Number ha la **priorità più alta (100)** del catalogo: viene tentato _dopo_ qualunque altra tecnica. Ogni applicazione conta come "passo try-algorithm" (visibile come badge `T_n_` sul catalogo), ed è l'indicatore più netto del livello di difficoltà dello schema.

## Come sceglie la cella — MRV + Degree

Per limitare l'esplosione combinatoria, Try Number sceglie la cella di dirama con un'euristica a due livelli:

- **MRV (Minimum Remaining Values)**: tra tutte le celle ancora vuote, prende quelle con il _minimo_ numero di candidati (tipicamente 2). Meno opzioni = meno rami da esplorare.
- **Degree** (tie-break): a parità di candidati, preferisce la cella che _vede_ più celle vuote (riga + colonna + quadrato). Una cella con alto degree, una volta valorizzata, propaga i suoi vincoli a più celle, facendo progredire la risoluzione il più possibile all'interno del ramo.

## Esempio — split sulla cella H5

> Stato al passo in cui il solver applica Try Number. Ci sono molte celle con 2 candidati (MRV = 2). L'euristica Degree seleziona **H5** (in primario) con candidati {4, 6}: è la cella bi-valore che "vede" il maggior numero di celle vuote nei suoi gruppi.

::board[example_1]

> Lo schema si dirama in due copie: nel ramo A H5 = 4, nel ramo B H5 = 6. Ciascuno prosegue indipendentemente con tutti gli algoritmi del catalogo. Se uno dei due incontra una contraddizione (cella vuota con zero candidati o gruppo con due valori uguali) viene scartato; l'altro continua fino alla soluzione.

## Peso nella difficoltà

Il factor `+400+(4*NU*NEP)` è il più alto del catalogo. La componente variabile (`NEP` alto a inizio schema, basso alla fine) penalizza particolarmente i _try_ che avvengono all'inizio del processo — un segno che gli algoritmi logici non sono bastati neanche per decantare. Un Try Number al 5% dello schema è considerevolmente più costoso di uno al 90%, dove resta solo un pugno di celle ancora da fissare.

## Alternative e note pratiche

Per chi risolve a mano, "arrivare a Try Number" equivale a dichiarare che nessuna tecnica nota permette di proseguire. SudokuLab usa Try Number come _backstop_: garantisce che qualunque schema a soluzione unica venga risolto in tempo finito, anche quando richiede una catena di ragionamenti condizionali (forcing chains, nice loops, ecc.) non ancora implementati nel catalogo.
