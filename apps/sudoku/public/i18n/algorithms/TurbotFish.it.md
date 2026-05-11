## L'idea — tre strong link concatenati

Fissiamo un valore **V**. In un gruppo (riga, colonna o quadrato) dove V può stare _esattamente in 2 celle_ abbiamo uno **strong link**: V andrà in una delle due e non nell'altra. Turbot Fish cerca **tre** di questi strong link legati tra loro:

- un gruppo **g1** con V in due celle — la cella "estremo" e una cella "interna";
- un gruppo di raccordo **g2** con V in due celle, che condivide la cella interna di g1 e la cella interna di g3;
- un gruppo **g3** con V in due celle — l'altra cella interna più la seconda cella "estremo".

I due veri estremi (la cella di g1 non toccata da g2 e la cella di g3 non toccata da g2) si comportano come un'alternativa esclusiva: **uno dei due deve contenere V**. Qualsiasi cella che "vede" (stesso gruppo) entrambi gli estremi non può contenere V: in ogni scenario uno dei due estremi prende V e la collide.

## Varianti classiche

- **Skyscraper**: g1 e g3 sono due colonne (o due righe) con V in due celle, g2 è una riga (o colonna) che congiunge le celle alte.
- **Two-String Kite**: g1 è una riga e g3 una colonna, collegate da un quadrato g2.
- **Empty Rectangle**: stessa logica, g2 è un quadrato in cui V è confinato a una riga + una colonna.

La nostra implementazione li riconosce tutti indistintamente cercando qualunque combinazione di 3 gruppi collegati.

## Esempio — Turbot Fish per il valore 1

> Stato al passo in cui il solver applica Turbot Fish. Il valore **1** ha tre strong link concatenati:

- **riga A** (g1): 1 solo in **A1** e **A5**;
- **quadrato 2** (g2, raccordo): 1 solo in **A5** e **C6**;
- **colonna 6** (g3): 1 solo in **C6** e **E6**.

> La catena è **A1 — A5 — C6 — E6**. I due estremi sono **A1** ed **E6**: in ogni caso uno dei due contiene l'1.

::board[example_1]

> La cella **E1** vede **A1** (stessa colonna) ed **E6** (stessa riga): qualunque dei due estremi prenda l'1, E1 non può averlo. Quindi il candidato 1 viene rimosso da E1 (candidati {1, 2, 3, 9} → {2, 3, 9}).

## Come riconoscerlo velocemente

Scegli un valore V. Cerca tutti i gruppi (righe, colonne, quadrati) in cui V ha esattamente 2 posizioni e costruisci mentalmente un grafo di strong link. Per ogni terzetto g1–g2–g3 in cui g2 aggancia g1 e g3 con due celle diverse, guarda gli estremi non comuni: se esiste una cella esterna che li vede entrambi, V si rimuove da lì.
