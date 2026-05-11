## When it applies

Take a group (row, column or box) and look for **four values** **W**, **X**, **Y** and **Z** that together have _only four possible positions_ in the group, i.e. four cells **c₁**, **c₂**, **c₃** and **c₄**. No other place in the group can host W, X, Y or Z: they are forced to go there.

Those four cells may also hold **other** candidates (that is why it is called "hidden"): you cannot spot it by looking at the candidates of single cells, you must reason about the values and where they can sit. Once the pattern is found, the candidates other than W, X, Y, Z can be removed from c₁, c₂, c₃ and c₄.

It is the direct extension of _Hidden Triple_ to four values: rarer, because it requires finding four "compact" digits in the same group at once.

## Example — quad (1, 2, 3, 4) in row A

> In the state below, in **row A** the digits **1**, **2**, **3** and **4** can only sit in cells **A1**, **A2**, **A3** and **A4** (primary):

- the 1 is ruled out by the top-right box (B7=1) and thus by A7, A8, A9;
- the 2 is ruled out by column 9 (B9=2) and by the top-right box, thus by A7, A8, A9;
- the 3 is ruled out by column 7 (C7=3) and by the top-right box, thus by A7, A8, A9;
- the 4 is ruled out by column 8 (C8=4) and by the top-right box, thus by A7, A8, A9.

::board[example_1]

> A1, A2, A3 and A4 currently show candidates {1, 2, 3, 4, 9}: the first four are the hidden pattern, the 9 is a "spurious" candidate to be removed from all four cells. After applying the algorithm those four cells will have candidates {1, 2, 3, 4}, effectively becoming a naked quad: the next step can then remove 1, 2, 3 and 4 from the other cells of the row or of any other group shared by the four cells.

> _Didactic note_: the schema below is a partial state built specifically to isolate the pattern. In SudokuLab's real puzzle catalogue Hidden Quad is essentially never reached, because simpler algorithms (One Cell For Value, Twins, Naked Triple, Hidden Triple…) solve the schemas before this level of candidate concentration is reached.

## Why it works

Every sudoku group contains each digit exactly once. If four digits W, X, Y, Z can only end up in four shared cells, the correspondence is forced: those four cells will contain exactly those four digits (in some order). No other value can therefore occupy them.

## How to spot it quickly

Start from the _values_, not from the cells. For each group, count in how many cells each digit from 1 to 9 can still go. If four digits all share the same restricted set of 4 positions (or a subset of it), you have a hidden quad. This search is the most attention-demanding: it is worth doing only after exhausting naked subsets and hidden triple.
