## When it applies

Within a group, find **four cells** whose candidates, taken as a union, are _exactly four values_ **{W, X, Y, Z}**. Not every cell must hold all four candidates: it can have two, three or four, what matters is that **every candidate of the four cells** belongs to {W, X, Y, Z} and that the union is exactly 4 elements.

In this configuration W, X, Y and Z must occupy those four cells (in some order), so in the **other** cells of the group W, X, Y, Z can be removed from the candidates.

It is the direct extension of _Naked Triple_ to four cells: rarer, because finding four cells that "cooperate" on just four values inside the same group is a less frequent coincidence — but the exclusion logic is identical.

## Example — quad (2, 4, 6, 8) in column 8

> In **column 8** the cells **A8**, **B8**, **C8** and **H8** (primary) have candidates {4, 6}, {4, 6, 8}, {2, 4, 6, 8} and {2, 4, 6} respectively: their union is exactly {2, 4, 6, 8}. They form a "naked" quad: the values 2, 4, 6 and 8 must go into those four cells. In the other empty cells of column 8 these values are no longer admissible.

::board[example_1]

> Concrete effect (secondary): from **D8** (candidates {1, 2, 4, 6, 7}) the 2, 4 and 6 are removed; from **E8** ({1, 3, 4, 6, 9}) the 4 and 6 are removed; from **F8** ({1, 3, 4, 6, 7, 8}) the 4, 6 and 8 are removed; from **I8** ({1, 2, 7, 9}) the 2 is removed. In particular D8 is left with {1, 7} and E8 with {1, 3, 9}, two significant reductions that unlock the following steps.

## Why it works

A group contains each digit exactly once. If four cells of the group can together only host {W, X, Y, Z}, by a one-to-one correspondence the four digits W, X, Y, Z must be placed in those four cells. Consequently no other value can enter them, and in the other cells of the group W, X, Y, Z are no longer valid candidates.

## How to spot it quickly

Look at groups where 5–6 empty cells remain with few candidates "concentrated" on four values. If four of those cells have candidates all contained in a 4-value subset, you have a naked quad. Frequent configurations:

- two cells with 2 candidates + two cells with 3 candidates (e.g. {W, X} + {Y, Z} + {W, X, Y} + {X, Y, Z});
- three cells with 3 candidates + one cell with 4 candidates;
- all four cells with exactly the same 4 candidates.
