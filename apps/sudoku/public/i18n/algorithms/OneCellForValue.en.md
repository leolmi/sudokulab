## When it applies

Pick a group (a **row**, a **column** or a **box**) and a value **V** still missing from that group. If, scanning every empty cell of the group, **only one** can actually host V — because in all the others V is already present on their row, column or box — then V can be placed in that cell.

It is the most immediate technique: it does not require reasoning on the candidates of a single cell, only counting where a given value can still end up inside a group.

## Example — value 7 in row B

> The value 7 is still missing from row **B**. The empty cells are **B2**, **B3**, **B5** and **B6**: three of them (_secondary highlight_) already have 7 blocked by their column or by their box. Only **B3** (_primary_) is left, where 7 can be placed.

::board[example_1]

> In detail: at **B2**, 7 is ruled out by column 2 (F2 already contains 7); at **B5**, 7 is ruled out by the centre box (C6 already contains 7); at **B6**, 7 is ruled out by column 6 (C6 already contains 7). So B3 is the only possible position.

## Why it works

Every sudoku group must contain all values from 1 to 9 exactly once. If, within a group, a value can only sit in one cell, that cell **must** host it: there is no other possible placement.
