## When it applies

Take a group (row, column or box) and look for **three values** **X**, **Y** and **Z** that together have _only three possible positions_ in the group, i.e. three cells **c₁**, **c₂** and **c₃**. No other place in the group can host X, Y or Z: they are forced to go there.

Those three cells may also hold **other** candidates (that is why it is called "hidden"): you cannot spot it by looking at the candidates of single cells, you must reason about the values and where they can sit. Once the pattern is found, the candidates other than X, Y, Z can be removed from c₁, c₂ and c₃.

## Example — triple (1, 2, 3) in row A

> In the state below, in **row A** the digits **1**, **2** and **3** can only sit in cells **A1**, **A2** and **A3** (primary): in A8 and A9 the 1 is ruled out by column 8 (B8=1), the 2 is ruled out by column 9 (B9=2) and the 3 is ruled out by the top-right box (C7=3). Only the first three cells are still available positions.

::board[example_1]

> A1, A2 and A3 currently show candidates {1, 2, 3, 8, 9}: the first three are the hidden pattern, the others (8 and 9) have to be removed. After applying the algorithm those three cells will have candidates {1, 2, 3}, effectively becoming a naked triple: the next step can then remove 1, 2 and 3 from the other cells of the row (or of any other group shared by the three cells).

> _Didactic note_: the schema below is a partial state built specifically to isolate the pattern. In SudokuLab's real puzzle catalogue Hidden Triple is normally not reached, because simpler algorithms (One Cell For Value, Twins, Naked Triple…) solve the schemas before this level kicks in.

## Why it works

Every sudoku group contains each digit exactly once. If three digits X, Y, Z can only end up in three shared cells, the correspondence is forced: those three cells will contain exactly those three digits (in some order). No other value can therefore occupy them.
