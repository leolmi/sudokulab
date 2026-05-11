## When it applies

Couples spots a chain of **three bi-value cells** with candidates of the form **{X, Y}**, **{Y, Z}** and **{X, Z}** (three digits that "swap" pairwise across the three cells). For the algorithm to fire:

- two of the three cells — call them _XY_ and _YZ_ — share a group (row, column or box), and they _share_ exactly one candidate: **Y**;
- the third cell — _XZ_ — shares a different group with _XY_ (or with _YZ_) and has candidates {X, Z}.

In this configuration the value **Z** can be removed from every cell that _sees both_ _XZ_ and _YZ_ (i.e. shares a group with each). By symmetry, swapping the chain's sides, **X** can be removed from cells that see both _XZ_ and _XY_.

## Why it works

Start from the chain _XY — YZ_ (same group) and the third cell _XZ_. Cell _XY_ will be X or Y:

- if _XY = Y_, then in the shared group _YZ_ cannot be Y → _YZ = Z_;
- if _XY = X_, then in another shared group _XZ_ cannot be X → _XZ = Z_.

In both cases **Z** ends up either in _XZ_ or in _YZ_: it cannot therefore sit in any cell that sees both.

## Example — chain (1, 2, 3) in column 1

> In the state below **column 1** contains three bi-value cells: **A1** = {1, 2}, **D1** = {2, 3} and **B1** = {1, 3} (primary). A1 and D1 are in the same group (column 1) and share only the value Y = 2 → X = 1, Z = 3. B1 is the third cell: it still shares column 1 with A1 (in a different group: box 1) and has candidates {X, Z} = {1, 3}.

::board[example_1]

> Effect (secondary): cell **C1** sees both _B1_ (XZ) and _D1_ (YZ) — both share column 1 with C1. So from C1 (candidates {1, 2, 3, 9}) the value **3** can be removed: C1 becomes {1, 2, 9}.

## Relation with XY-Wing

Couples and XY-Wing describe the same kind of chain; only the way to spot it changes. Couples starts from _two_ bi-value cells in the same group and then looks for the third; XY-Wing starts from a bi-value "pivot" and then looks for two "wings" connected to the pivot. Couples has lower priority in SudokuLab's solver (it is tried first): every pattern it finds is essentially a subset of those XY-Wing would catch, when one of the wings shares a group with the pivot.
