## Quando si applica

Couples individua una catena di **tre celle bivalore** con candidati del tipo **{X, Y}**, **{Y, Z}** e **{X, Z}** (tre cifre che si "scambiano" a due a due tra le tre celle). Perché l'algoritmo scatti:

- due delle tre celle — chiamiamole _XY_ e _YZ_ — condividono un gruppo (riga, colonna o quadrato), e _condividono_ esattamente un candidato: **Y**;
- la terza cella — _XZ_ — condivide un gruppo diverso con _XY_ (oppure con _YZ_) e ha candidati {X, Z}.

In questa configurazione il valore **Z** può essere rimosso da ogni cella che _vede contemporaneamente_ _XZ_ e _YZ_ (cioè che sta in un gruppo comune alle due). Simmetricamente, scambiando il ruolo dei "lati" della catena, **X** può essere rimosso dalle celle che vedono insieme _XZ_ e _XY_.

## Perché funziona

Partiamo dalla catena _XY — YZ_ (stesso gruppo) e dalla terza cella _XZ_. La cella _XY_ varrà X oppure Y:

- se _XY = Y_, allora nel gruppo comune _YZ_ non può essere Y → _YZ = Z_;
- se _XY = X_, allora in un altro gruppo comune _XZ_ non può essere X → _XZ = Z_.

In entrambi i casi **Z** finisce o in _XZ_ o in _YZ_: non può quindi stare in alcuna cella che le veda entrambe.

## Esempio — catena (1, 2, 3) in colonna 1

> Nello stato qui sotto la **colonna 1** contiene tre celle bivalore: **A1** = {1, 2}, **D1** = {2, 3} e **B1** = {1, 3} (primario). A1 e D1 sono nello stesso gruppo (colonna 1) e condividono solo il valore Y = 2 → X = 1, Z = 3. B1 è la terza cella: sta ancora in colonna 1 con A1 (in un gruppo diverso: il quadrato 1) e ha proprio candidati {X, Z} = {1, 3}.

::board[example_1]

> Effetto (secondario): la cella **C1** vede contemporaneamente _B1_ (XZ) e _D1_ (YZ) — entrambe in colonna 1 con C1. Quindi da C1 (candidati {1, 2, 3, 9}) il valore **3** può essere rimosso: C1 diventa {1, 2, 9}.

## Rapporto con XY-Wing

Couples e XY-Wing descrivono lo stesso tipo di catena; cambia solo il modo di riconoscerla. Couples parte da _due_ celle bivalore nello stesso gruppo e poi cerca la terza; XY-Wing parte da un "pivot" bivalore e poi cerca due "wings" collegate al pivot. Couples ha priorità più bassa nel solver di SudokuLab (viene tentato prima): ogni pattern che trova è in pratica un sottoinsieme di quelli rilevabili da XY-Wing, quando una delle wings condivide un gruppo col pivot.
