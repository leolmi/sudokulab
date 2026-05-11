## When it applies

Within a group, find **three cells** whose candidates, taken as a union, are _exactly three values_ **{X, Y, Z}**. Not every cell must hold all three candidates: it can have two or all three, what matters is that **every candidate of the three cells** belongs to {X, Y, Z} and that the union is exactly 3 elements.

In this configuration X, Y and Z must occupy those three cells (in some order), so in the **other** cells of the group X, Y and Z can be removed from the candidates.

_Typical configurations_: {X, Y} + {Y, Z} + {X, Z}, or {X, Y, Z} + {X, Y} + {Y, Z}, or {X, Y, Z} repeated in all three cells.

## Example — triple (1, 2, 5) in row H

> In row **H** the cells **H1**, **H3** and **H8** (primary) have candidates {1, 2, 5}, {1, 2, 5} and {2, 5} respectively: their union is exactly {1, 2, 5}. They form a "naked" triple: the values 1, 2 and 5 must go into those three cells. In the other empty cells of row H these values are no longer admissible.

::board[example_1]

> Concrete effect (secondary): from **H4** (candidates {1, 4, 8}) the 1 is removed; from **H7** (candidates {1, 4, 5}) both 1 and 5 are removed. H5 ({4, 8}) has none of the three values, so it stays unchanged.

## Why it works

A group contains each digit exactly once. If three cells of the group can together only host {X, Y, Z}, by a "one-to-one correspondence" the three digits X, Y, Z must be placed in those three cells. Consequently no other value can enter them, and in the other cells of the group X, Y, Z are no longer valid candidates.
