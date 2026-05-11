## The idea — conjugate pairs and alternating colouring

Fix a value **V**. In a group (row, column or box) where V can sit in _exactly 2 cells_ we have a **conjugate pair**: V will go in one of the two, not in the other. It is a binary choice.

If two conjugate pairs share a cell, they connect into a chain. Continuing, we get a structure of connected cells, all tied to the "V here yes / V here no" choice. The chain can be coloured with **two alternating colours**: every edge between cells of the chain corresponds to a conjugate pair, and the two endpoints get different colours (just like a bipartite graph). The meaning: if a colour-A cell hosts V, then every other colour-A cell in the same chain hosts V, and every colour-B cell does not (and vice versa).

## Color-wrap — elimination inside the chain

If two cells _of the same colour_ end up in the same group (row/column/box), then that colour cannot be "on" (it would have two V's in the same group, which is forbidden). So that colour is necessarily FALSE and V can be removed from **all** cells of that colour.

## Color-trap — elimination outside the chain

A cell outside the chain that sees at least one cell of _each_ colour cannot host V: in one scenario (A on / B on) V sits in one of the cells it sees, in the other scenario in the other one. Either way the external cell "collides" with V.

## Example — color-wrap on the value 2

> Schema state at the step where the solver applies Simple Colouring. For the value **2** a chain of 8 cells forms, connected through conjugate pairs (rows, columns and boxes where 2 has only 2 positions):

- **Colour A** (primary): **A2**, **B7**, **I9**;
- **Colour B** (secondary): **A9**, **G2**, **B3**, **G7**, **I3**.

::board[example_1]

> Two cells of the same colour B, **G2** and **I3**, belong to the _same box_ (bottom-left). So "B on" would produce two 2's in the same box — impossible. Therefore B is FALSE: the candidate 2 is removed from **all** colour-B cells (A9, G2, B3, G7, I3). In this specific case the effect is particularly strong: four of those cells are left with a single candidate and become naked singles, opening a big advance.

## How to spot it quickly

Pick a value V. For every group where V can go in exactly two cells, mentally draw an edge between them. Start from a node, colour alternately along the edges: if at some point two same-coloured cells fall in the same group you have a color-wrap. If a cell outside the chain sees at least one node of each colour you have a color-trap.
