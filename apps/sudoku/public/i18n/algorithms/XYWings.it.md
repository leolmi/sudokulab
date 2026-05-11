## Quando si applica

Si cercano tre celle bivalore collegate a forma di "Y":

- un **pivot** con candidati **{X, Y}**;
- una **wing** con candidati **{X, Z}** che sta in un gruppo comune col pivot (riga, colonna o quadrato);
- un'altra **wing** con candidati **{Y, Z}** che sta in un _diverso_ gruppo comune col pivot.

In questa configurazione il valore **Z** può essere rimosso da ogni cella che vede _contemporaneamente_ entrambe le wings.

## Perché funziona

Il pivot vale X oppure Y:

- se **pivot = X**, la wing {X, Z} non può essere X (vede il pivot), quindi vale **Z**;
- se **pivot = Y**, la wing {Y, Z} non può essere Y (vede il pivot), quindi vale **Z**.

In ogni scenario **una** delle due wings vale Z: il valore Z è quindi già "prenotato" su una di loro e non può più stare nelle celle che le vedono entrambe.

## Esempio — Z = 4 in un puzzle reale

> Stato dello schema al passo in cui il solver applica XY-Wings. Le tre celle in primario formano il pattern: pivot **F7** = {7, 9}, wing **C7** = {4, 9} (stessa colonna 7 del pivot), wing **D9** = {4, 7} (stesso quadrato del pivot). Il candidato comune alle due wings (che ruota attorno al pivot) è **Z = 4**.

::board[example_1]

> Effetto sulle celle impattate (secondario): le celle che vedono _sia_ C7 _che_ D9 sono quelle che stanno in colonna 9 _e_ nel quadrato in alto a destra. Sono **A9** (candidati {4, 7, 8} → perde 4, resta {7, 8}) e **C9** ({4, 8} → perde 4, resta un naked single {8} che il passo successivo valorizzerà).

## Come riconoscerlo velocemente

Parti da una cella bivalore, ipotizzala come pivot. Controlla nei suoi gruppi (riga, colonna, quadrato) se esistono altre due celle bivalore che insieme "coprono" i due valori del pivot più un terzo valore comune Z. Se sì, guarda l'intersezione della visibilità delle due wings: ogni candidato Z in quelle celle sparisce.
