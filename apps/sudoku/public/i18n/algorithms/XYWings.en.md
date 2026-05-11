## When it applies

Look for three bi-value cells linked in a "Y" shape:

- a **pivot** with candidates **{X, Y}**;
- a **wing** with candidates **{X, Z}** that shares a group with the pivot (row, column or box);
- another **wing** with candidates **{Y, Z}** that shares a _different_ group with the pivot.

In this configuration the value **Z** can be removed from every cell that sees _both_ wings simultaneously.

## Why it works

The pivot is X or Y:

- if **pivot = X**, the wing {X, Z} cannot be X (it sees the pivot), so it is **Z**;
- if **pivot = Y**, the wing {Y, Z} cannot be Y (it sees the pivot), so it is **Z**.

In every scenario **one** of the two wings is Z: the value Z is therefore already "reserved" on one of them and cannot sit in cells that see both.

## Example — Z = 4 in a real puzzle

> Schema state at the step where the solver applies XY-Wings. The three primary cells form the pattern: pivot **F7** = {7, 9}, wing **C7** = {4, 9} (same column 7 as the pivot), wing **D9** = {4, 7} (same box as the pivot). The candidate shared by the two wings (rotating around the pivot) is **Z = 4**.

::board[example_1]

> Effect on the impacted cells (secondary): the cells that see _both_ C7 _and_ D9 are those in column 9 _and_ in the top-right box. They are **A9** (candidates {4, 7, 8} → loses 4, becomes {7, 8}) and **C9** ({4, 8} → loses 4, becomes a naked single {8} that the next step will set).

## How to spot it quickly

Start from a bi-value cell, treat it as the pivot. In its groups (row, column, box) check whether two other bi-value cells together "cover" the pivot's two values plus a third common value Z. If so, look at the intersection of the wings' visibility: every candidate Z in those cells vanishes.
