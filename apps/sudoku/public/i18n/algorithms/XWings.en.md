## When it applies

Consider a value **V**. X-Wings spots the pattern when:

- in **two different rows** V can sit in _exactly_ two cells;
- the two positions in the two rows fall on the **same two columns**.

The four cells form a rectangle (the "X-Wing"). Since V must go in both rows and only on those two columns, V cannot appear in any other cell of those columns.

## Example — X-Wing on the value 1

> Schema state at the step where the solver applies the algorithm. The candidate **1** is confined to only two cells in **column 3** (D3, I3) and to only two cells in **column 4** (D4, I4). The four cells, highlighted in primary, are aligned on the same two rows (D and I) and form the X-Wing rectangle. The secondary cell (**D5**) is the one from which the solver, as a result of the algorithm, removes the candidate 1.

::board[example_1]

> Given the pattern, the value 1 can be **eliminated** from every other cell of rows **D** and **I**: in those rows the 1 can only land on one of the four corners of the rectangle.

## Why it works

Columns 3 and 4 must each contain a 1. If both can host the 1 only in rows D and I, then one column takes its 1 in row D and the other in row I (the only two possible combinations). Either way rows D and I already hold their 1 in the corners, so they cannot contain any other.
