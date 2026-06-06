## Quando si applica

Si cercano due celle **bivalore con la stessa coppia** di candidati **{A, B}** (le "ali"), raccordate da un **legame forte** su uno dei due valori:

- un valore, ad esempio **A**, in un certo gruppo (riga, colonna o quadrato) può stare **solo in due celle** — una coppia coniugata: chiamiamole **P** e **Q**;
- la prima ala vede **P**, la seconda vede **Q**.

In questa configurazione il valore **B** può essere rimosso da ogni cella che vede _contemporaneamente_ entrambe le ali.

## Perché funziona

Nel gruppo del legame forte la **A** sta per forza o in **P** o in **Q**:

- se **P = A**, l'ala che vede P non può essere A, quindi vale **B**;
- se **Q = A**, l'ala che vede Q non può essere A, quindi vale **B**.

In ogni caso **una** delle due ali vale B: il valore B è quindi già "prenotato" su una di loro e non può più stare nelle celle che le vedono entrambe.

> **Non è un XY-Wing.** Nell'XY-Wing tre celle ruotano attorno a un _pivot_ e ogni ala condivide col pivot un valore diverso. Nel W-Wing le due ali condividono l'_intera_ coppia {A, B} e il raccordo è un legame forte tra due celle, non un pivot.

## Esempio — escludere il 9 da I9

> Stato dello schema al passo in cui il solver applica il W-Wing. Le ali (primario) **E9** e **I6** hanno entrambe come soli candidati **{5, 9}**. Nella **colonna 1** il **5** può stare solo in **E1** o in **I1** (legame forte): E9 vede E1 sulla riga E, I6 vede I1 sulla riga I.

::board[example_1]

> Poiché il 5 occuperà uno fra E1 e I1, una fra E9 e I6 varrà per forza **9**. La cella **I9** (secondario) vede entrambe le ali — E9 sulla colonna 9, I6 sulla riga I — quindi il **9** viene rimosso e I9 resta {5, 6}.

## Come riconoscerlo velocemente

Parti da due celle bivalore con la **stessa** coppia {A, B}. Cerca un valore della coppia che in un gruppo abbia **solo due posizioni** (legame forte) tali che un estremo veda la prima cella e l'altro la seconda. Se lo trovi, l'altro valore della coppia sparisce da tutte le celle che vedono entrambe le ali.
