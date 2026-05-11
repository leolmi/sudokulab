## Quando si applica

Si considera un gruppo **A** (riga, colonna o quadrato) e un valore **V**. Si guardano le celle di A in cui V è ancora candidato: se sono _tutte_ contenute anche in un secondo gruppo **B** — ad esempio sono tutte nello stesso quadrato, o tutte nella stessa riga/colonna — allora V, quando finirà in A, dovrà finire in una di quelle celle comuni, quindi **anche** dentro B.

Conseguenza: in B si può rimuovere V da ogni cella che non appartiene ad A.

Questa logica cattura due sotto-casi classici:

- **Pointing**: in un _quadrato_ V è allineato su una riga o su una colonna → si elimina V dalle altre celle di quella riga/colonna.
- **Claiming** (o box-line reduction): in una _riga_ o _colonna_ V è confinato dentro un solo quadrato → si elimina V dalle altre celle di quel quadrato.

## Esempio — claiming del 6 dalla colonna 1 al quadrato 1

> In **colonna 1** il candidato **6** rimane possibile solo nelle celle **B1** e **C1** (evidenziate in primario). Entrambe stanno nel quadrato in alto a sinistra (_quadrato 1_). Quindi il 6, quando finirà in colonna 1, finirà per forza in una delle due, e dentro il quadrato 1 non può comparire altrove.

::board[example_1]

> Effetto concreto: nella cella **B3** (_secondario_) il candidato 6 viene rimosso, perché B3 sta nel quadrato 1 ma non in colonna 1 — e il 6 del quadrato 1 è già "claimato" dalla colonna.

## Perché funziona

Ogni riga, colonna e quadrato deve contenere V esattamente una volta. Se in un gruppo A tutte le posizioni dove V è ancora possibile stanno anche in un secondo gruppo B, allora la collocazione di V in A è sicuramente anche una cella di B. Dunque V non può stare in nessun'altra cella di B.
