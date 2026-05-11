## L'idea — coppie coniugate e colorazione alternata

Fissiamo un valore **V**. In un gruppo (riga, colonna o quadrato) dove V può stare _esattamente in 2 celle_ abbiamo una **coppia coniugata**: V andrà in una delle due, l'altra no. È come una "scelta binaria".

Se due coppie coniugate condividono una cella, si collegano in una catena. Proseguendo si ottiene una struttura di celle collegate, tutte legate alla scelta "V qui sì / V qui no". La catena si può colorare con **due colori alternati**: ogni arco tra celle della catena corrisponde a una coppia coniugata, e i due estremi dell'arco prendono colori diversi (proprio come un grafo bipartito). Il significato: se una cella di colore A contiene V, allora tutte le altre celle di colore A nella stessa catena contengono V, e tutte quelle di colore B no (e viceversa).

## Color-wrap — eliminazione dentro la catena

Se due celle _dello stesso colore_ finiscono nello stesso gruppo (riga/colonna/quadrato), allora quel colore non può essere "on" (avrebbe due V nello stesso gruppo, il che è proibito). Quindi quel colore è necessariamente FALSE e V può essere rimosso da **tutte** le celle di quel colore.

## Color-trap — eliminazione fuori dalla catena

Una cella esterna alla catena che vede almeno una cella di _ciascun_ colore non può contenere V: in uno dei due scenari (A on / B on) V è in una delle celle che essa vede, nel secondo è nell'altra. In entrambi i casi la cella esterna "collide" con V.

## Esempio — color-wrap sul valore 2

> Stato al passo in cui il solver applica Simple Colouring. Per il valore **2** si forma una catena di 8 celle collegate da coppie coniugate (righe, colonne e quadrati in cui 2 ha solo 2 posizioni):

- **Colore A** (in primario): **A2**, **B7**, **I9**;
- **Colore B** (in secondario): **A9**, **G2**, **B3**, **G7**, **I3**.

::board[example_1]

> Due celle dello stesso colore B, **G2** e **I3**, appartengono allo _stesso quadrato_ (box in basso a sinistra). Quindi "B on" produrrebbe due 2 nel medesimo box — impossibile. Di conseguenza B è FALSE: il candidato 2 viene rimosso da **tutte** le celle di colore B (A9, G2, B3, G7, I3). Nel caso specifico l'effetto è particolarmente forte: quattro di quelle celle restano con un unico candidato e diventano naked single, aprendo un forte avanzamento.

## Come riconoscerlo velocemente

Scegli un valore V. Per ogni gruppo in cui V può andare in esattamente due celle disegna mentalmente un arco che le unisce. Parti da un nodo, colora alternatamente lungo gli archi: se in qualche momento due celle dello stesso colore cadono nello stesso gruppo hai un color-wrap. Se una cella fuori dalla catena vede almeno un nodo di ciascun colore hai un color-trap.
