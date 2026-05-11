## Quando si applica

In un gruppo si individuano **tre celle** i cui candidati, presi in unione, sono _esattamente tre valori_ **{X, Y, Z}**. Non serve che ogni cella abbia tutti e tre i candidati: può averne due, oppure tutti e tre, l'importante è che **ogni candidato delle tre celle** appartenga a {X, Y, Z} e che l'unione valga esattamente 3 elementi.

In questa configurazione X, Y e Z dovranno occupare proprio quelle tre celle (in un qualche ordine), quindi nelle **altre** celle del gruppo X, Y e Z possono essere rimossi dai candidati.

_Esempi di configurazioni tipiche_: {X, Y} + {Y, Z} + {X, Z}, oppure {X, Y, Z} + {X, Y} + {Y, Z}, oppure {X, Y, Z} ripetuto in tutte e tre le celle.

## Esempio — terna (1, 2, 5) in riga H

> Nella riga **H** le celle **H1**, **H3** e **H8** (primario) hanno rispettivamente candidati {1, 2, 5}, {1, 2, 5} e {2, 5}: l'unione vale esattamente {1, 2, 5}. Formano quindi una terna "naked": i valori 1, 2 e 5 devono andare in quelle tre celle. Nelle altre celle vuote di riga H questi valori non sono più ammissibili.

::board[example_1]

> Effetto concreto (secondario): da **H4** (candidati {1, 4, 8}) si rimuove l'1; da **H7** (candidati {1, 4, 5}) si rimuovono 1 e 5. H5 ({4, 8}) non ha nessuno dei tre valori, quindi resta invariata.

## Perché funziona

Un gruppo contiene ogni cifra esattamente una volta. Se tre celle del gruppo possono contenere complessivamente solo {X, Y, Z}, per l'equivalente di una "corrispondenza biunivoca" le tre cifre X, Y, Z devono collocarsi in quelle tre celle. Di conseguenza nessun altro valore può entrarci, e nelle altre celle del gruppo X, Y, Z non sono più candidati validi.
