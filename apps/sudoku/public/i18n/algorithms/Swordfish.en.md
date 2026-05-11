## When it applies

Consider a value **V**. Swordfish spots the pattern when:

- in **three different columns** V can only sit in 2-3 cells each;
- the union of all these positions falls _exactly_ on the same **three rows**.

(The symmetric case holds swapping rows with columns.) The three rows "capture" every one of the 1-2-3 free positions for V in the three columns. So in those three rows V must necessarily sit inside the three fish columns: it can be removed from every other cell of those three rows.

## Why it works

Each of the three columns must contain V (it is a sudoku digit). Since in each column V can only sit on one of the three chosen rows, overall V occupies exactly three cells at the columns × rows intersection of the fish (one per column, one per row — a one-to-one correspondence). Each row therefore already has "its" V localised in those columns: in the other cells of the same row V can no longer appear.

X-Wings is the N = 2 case of this same logic; Swordfish is N = 3; Jellyfish is N = 4.

## Example — Swordfish on the value 3

> Schema state at the step where the solver applies Swordfish. The candidate **3** is confined to only two cells in each of three columns:

- column 2: **A2**, **G2**;
- column 6: **A6**, **E6**;
- column 9: **E9**, **G9**.

> The union of these six positions only touches rows **A**, **E** and **G**: the pattern is complete.

::board[example_1]

> Effect (secondary): in row G the solver removes 3 from **G7** (candidates {2, 3, 6} → {2, 6}). Rows A and E are already filled outside the fish columns, so they produce no further eliminations.

## How to spot it quickly

Pick a value V and look, for each column, at how many rows it can still go in (columns with 1 position are naked singles; ignore them). Find three columns where V has 2-3 positions each, and write down the involved rows: if the union has exactly 3 rows, you have a Swordfish.
