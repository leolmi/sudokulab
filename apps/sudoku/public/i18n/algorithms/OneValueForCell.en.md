## When it applies

Pick an empty cell and look at the three groups it belongs to (row, column, box). If among the values **1–9** only **one** is left that is not yet present in any of the three groups, that cell **must** host that value.

Unlike _One Cell For Value_, which starts from a value and looks for the cell that can host it inside a group, here we start from the cell and rule out candidate after candidate until only one is left. It is less immediate by eye: it requires keeping track of candidates (the "pencil marks" table), which is why in SudokuLab it carries a slightly higher difficulty weight.

## Example — cell A5

> Cell **A5** is highlighted in primary. Its three groups — row **A**, column **5**, top-centre box — are background-coloured: between them they already contain eight distinct values (1, 2, 3, 4, 5, 6, 8, 9). The only value still admissible is **7**, so A5 = 7.

::board[example_1]

> Quick check: row A already contains 3, 4, 6, 2, 1, 9; column 5 contains 5, 8, 6, 4; the top-centre box contains 6, 2, 5, 4. The union of these values is { 1, 2, 3, 4, 5, 6, 8, 9 }: only 7 is missing.

## Why it works

A cell must take one of the nine values 1–9. If eight of those are forbidden by the three groups it belongs to, the only admissible one is forced: no other solution is possible for that cell.
