## When it applies

Fix a value **V**. Jellyfish spots the pattern when:

- in **four different rows** V can only sit in 2-4 cells each;
- the union of all these positions falls _exactly_ on the same **four columns**.

(The symmetric case holds swapping rows with columns.) The four rows "capture" every free spot for V in the four columns. So in those four rows V must necessarily sit inside the four fish columns: it can be removed from every other cell of those four columns.

## Why it works

Each of the four columns must contain V (it is a sudoku digit). Since in each column V can only sit on one of the four chosen rows, overall V occupies exactly four cells at the columns × rows intersection of the fish (one per column, one per row — a one-to-one correspondence). Each row therefore already has "its" V localised in those columns: in the other cells of the same row V can no longer appear.

X-Wings is the N = 2 case of this same logic; Swordfish is N = 3; Jellyfish is N = 4. Beyond N = 4 the technique becomes redundant (a size-5 fish on 9 rows is equivalent to a size-4 fish on the other 4 — the well-known _finned complement_ principle).

## Example — Jellyfish on the value 8

> Schema state at the step where the solver applies Jellyfish. The candidate **8** is confined to 2-4 cells in each of four rows:

- row B: **B1**, **B9**;
- row C: **C1**, **C7**, **C9**;
- row H: **H1**, **H2**, **H7**, **H9**;
- row I: **I1**, **I2**, **I9**.

> The union of these twelve positions only touches columns **1**, **2**, **7** and **9**: the pattern is complete.

::board[example_1]

> Effect: in the four fish columns, the cells outside the four rows lose the candidate 8. In this schema this only hits row G — **G1**, **G7** and **G9** (all in secondary).

## How to spot it quickly

Pick a value V and, for each row, count in how many columns V can still go (ignore rows with a single position: those are naked singles). Find four rows with 2-4 positions each, then look at the union of the involved columns: if it is exactly 4 you have a Jellyfish. Repeat swapping rows and columns.
