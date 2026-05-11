## Quando si applica

Si sceglie una cella vuota e si guardano i tre gruppi a cui appartiene (riga, colonna, quadrato). Se tra i valori **1–9** ne rimane **uno soltanto** non ancora presente in nessuno dei tre gruppi, quella cella **deve** contenere quel valore.

A differenza di _One Cell For Value_, che parte da un valore e cerca la cella che può ospitarlo in un gruppo, qui si parte dalla cella e si elimina candidato per candidato finché ne resta uno solo. È meno immediato a occhio nudo: occorre tenere traccia dei candidati (la tabella dei "pencil marks"), motivo per cui in SudokuLab ha un peso di difficoltà leggermente più alto.

## Esempio — cella A5

> La cella **A5** è evidenziata in primario. I suoi tre gruppi — riga **A**, colonna **5**, quadrato in alto al centro — sono colorati di sfondo: contengono già otto valori distinti (1, 2, 3, 4, 5, 6, 8, 9). L'unico valore ancora ammissibile è il **7**, quindi A5 = 7.

::board[example_1]

> Controllo rapido: riga A contiene già 3, 4, 6, 2, 1, 9; colonna 5 contiene 5, 8, 6, 4; il quadrato in alto al centro contiene 6, 2, 5, 4. L'unione di questi valori è { 1, 2, 3, 4, 5, 6, 8, 9 }: manca solo il 7.

## Perché funziona

Una cella deve assumere uno dei nove valori 1–9. Se otto di questi sono vietati dai tre gruppi di appartenenza, l'unico ammissibile è obbligato: non esiste un'altra soluzione possibile per quella cella.
