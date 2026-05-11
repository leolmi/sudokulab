## Quando si applica

In un gruppo si individuano **quattro celle** i cui candidati, presi in unione, sono _esattamente quattro valori_ **{W, X, Y, Z}**. Non serve che ogni cella abbia tutti e quattro i candidati: può averne due, tre o quattro, l'importante è che **ogni candidato delle quattro celle** appartenga a {W, X, Y, Z} e che l'unione valga esattamente 4 elementi.

In questa configurazione W, X, Y e Z dovranno occupare proprio quelle quattro celle (in un qualche ordine), quindi nelle **altre** celle del gruppo W, X, Y, Z possono essere rimossi dai candidati.

È l'estensione diretta di _Naked Triple_ a quattro celle: più raro, perché trovare quattro celle che "collaborano" su quattro soli valori all'interno dello stesso gruppo è una coincidenza meno frequente — ma la logica di esclusione è identica.

## Esempio — quaterna (2, 4, 6, 8) in colonna 8

> Nella **colonna 8** le celle **A8**, **B8**, **C8** e **H8** (primario) hanno rispettivamente candidati {4, 6}, {4, 6, 8}, {2, 4, 6, 8} e {2, 4, 6}: l'unione vale esattamente {2, 4, 6, 8}. Formano quindi una quaterna "naked": i valori 2, 4, 6 e 8 devono andare in quelle quattro celle. Nelle altre celle vuote di colonna 8 questi valori non sono più ammissibili.

::board[example_1]

> Effetto concreto (secondario): da **D8** (candidati {1, 2, 4, 6, 7}) si rimuovono 2, 4 e 6; da **E8** ({1, 3, 4, 6, 9}) si rimuovono 4 e 6; da **F8** ({1, 3, 4, 6, 7, 8}) si rimuovono 4, 6 e 8; da **I8** ({1, 2, 7, 9}) si rimuove 2. In particolare D8 resta con {1, 7} e E8 con {1, 3, 9}, due riduzioni notevoli che sbloccano i passi successivi.

## Perché funziona

Un gruppo contiene ogni cifra esattamente una volta. Se quattro celle del gruppo possono contenere complessivamente solo {W, X, Y, Z}, per una corrispondenza biunivoca le quattro cifre W, X, Y, Z devono collocarsi in quelle quattro celle. Di conseguenza nessun altro valore può entrarci, e nelle altre celle del gruppo W, X, Y, Z non sono più candidati validi.

## Come riconoscerlo velocemente

Cerca gruppi dove restano 5–6 celle vuote con pochi candidati "concentrati" su quattro valori. Se quattro di quelle celle hanno candidati tutti contenuti in un sottoinsieme di 4 valori, hai una naked quad. Configurazioni frequenti:

- due celle con 2 candidati + due celle con 3 candidati (es. {W, X} + {Y, Z} + {W, X, Y} + {X, Y, Z});
- tre celle con 3 candidati + una cella con 4 candidati;
- tutte e quattro le celle con esattamente gli stessi 4 candidati.
