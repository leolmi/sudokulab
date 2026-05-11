## Quando si applica

Fissiamo un valore **V**. Jellyfish vede il pattern quando:

- in **quattro righe** distinte V può stare solo in 2-4 celle ciascuna;
- l'unione di tutte queste posizioni cade _esattamente_ nelle stesse **quattro colonne**.

(Vale il simmetrico scambiando righe con colonne.) Le quattro righe "catturano" tutti i posti liberi per V nelle quattro colonne. Quindi in quelle quattro righe V deve necessariamente stare dentro le quattro colonne del fish: può essere rimosso da tutte le altre celle di quelle quattro colonne.

## Perché funziona

Ciascuna delle quattro colonne deve contenere V (è una cifra del sudoku). Poiché in ciascuna colonna V può stare solo in una delle quattro righe scelte, complessivamente V occupa esattamente quattro celle all'intersezione colonne × righe del fish (una per colonna, una per riga — corrispondenza biunivoca). Di conseguenza ciascuna riga ha già "il suo" V localizzato in quelle colonne: nelle altre celle della stessa riga V non può più comparire.

X-Wings è il caso N = 2 di questa stessa logica; Swordfish è N = 3; Jellyfish è N = 4. Oltre N = 4 la tecnica diventa ridondante (un fish di taglia 5 su 9 righe equivale a un fish di taglia 4 sulle altre 4 — è il principio noto come _finned complement_).

## Esempio — Jellyfish per il valore 8

> Stato al passo in cui il solver applica Jellyfish. Il candidato **8** è confinato a 2-4 celle in ciascuna di quattro righe:

- riga B: **B1**, **B9**;
- riga C: **C1**, **C7**, **C9**;
- riga H: **H1**, **H2**, **H7**, **H9**;
- riga I: **I1**, **I2**, **I9**.

> L'unione di queste dodici posizioni tocca _solo_ le colonne **1**, **2**, **7** e **9**: il pattern è completo.

::board[example_1]

> Effetto: nelle quattro colonne del fish, le celle fuori dalle quattro righe perdono il candidato 8. In questo schema ciò colpisce la sola riga G — **G1**, **G7** e **G9** (tutte evidenziate in secondario).

## Come riconoscerlo velocemente

Scegli un valore V e, per ogni riga, conta in quante colonne V può ancora stare (ignora le righe con una sola posizione: quelle sono naked singles). Cerca quattro righe con 2-4 posizioni ciascuna, poi guarda l'unione delle colonne coinvolte: se è esattamente 4 hai un Jellyfish. Ripeti scambiando righe e colonne.
