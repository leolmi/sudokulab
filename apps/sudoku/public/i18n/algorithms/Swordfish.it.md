## Quando si applica

Consideriamo un valore **V**. Swordfish vede il pattern quando:

- in **tre colonne** distinte V può stare solo in 2-3 celle ciascuna;
- l'unione di tutte queste posizioni cade _esattamente_ nelle stesse **tre righe**.

(Vale il simmetrico scambiando righe con colonne.) Le tre righe "catturano" tutti i 1-2-3 posti liberi per V nelle tre colonne. Quindi in quelle tre righe V deve necessariamente stare dentro le tre colonne del fish: può essere rimosso da tutte le altre celle di quelle tre righe.

## Perché funziona

Ciascuna delle tre colonne deve contenere V (è una cifra del sudoku). Poiché in ciascuna colonna V può stare solo in una delle tre righe scelte, complessivamente V occupa esattamente tre celle all'intersezione colonne × righe del fish (una per colonna, una per riga — corrispondenza biunivoca). Di conseguenza ciascuna riga ha già "il suo" V localizzato in quelle colonne: nelle altre celle della stessa riga V non può più comparire.

X-Wings è il caso N = 2 di questa stessa logica; Swordfish è N = 3; Jellyfish è N = 4.

## Esempio — Swordfish per il valore 3

> Stato al passo in cui il solver applica Swordfish. Il candidato **3** è confinato a due sole celle in ciascuna di tre colonne:

- colonna 2: **A2**, **G2**;
- colonna 6: **A6**, **E6**;
- colonna 9: **E9**, **G9**.

> L'unione di queste sei posizioni tocca _solo_ le righe **A**, **E** e **G**: il pattern è completo.

::board[example_1]

> Effetto (secondario): in riga G il solver rimuove 3 da **G7** (candidati {2, 3, 6} → {2, 6}). Riga A ed E sono già tutte filled fuori dalle colonne del fish, quindi non producono ulteriori eliminazioni.

## Come riconoscerlo velocemente

Scegli un valore V e guarda, per ogni colonna, in quante righe può ancora andare (le colonne con 1 posizione sono naked singles; ignorale). Cerca tre colonne dove V ha rispettivamente 2-3 posizioni, e annota le righe coinvolte: se l'unione ha esattamente 3 righe, hai uno Swordfish.
