## When it applies

Look for two **bi-value cells with the same pair** of candidates **{A, B}** (the "wings"), joined by a **strong link** on one of the two values:

- a value, say **A**, can sit in **only two cells** of some group (row, column or box) — a conjugate pair: call them **P** and **Q**;
- the first wing sees **P**, the second sees **Q**.

In this configuration the value **B** can be removed from every cell that sees _both_ wings simultaneously.

## Why it works

In the strong-link group **A** must be either in **P** or in **Q**:

- if **P = A**, the wing seeing P cannot be A, so it is **B**;
- if **Q = A**, the wing seeing Q cannot be A, so it is **B**.

In every case **one** of the two wings is B: the value B is therefore already "reserved" on one of them and can no longer sit in cells that see both.

> **It is not an XY-Wing.** In the XY-Wing three cells rotate around a _pivot_ and each wing shares a _different_ value with the pivot. In the W-Wing the two wings share the _whole_ pair {A, B} and the link is a strong link between two cells, not a pivot.

## Example — removing the 9 from I9

> Schema state at the step where the solver applies the W-Wing. The wings (primary) **E9** and **I6** both have only candidates **{5, 9}**. In **column 1** the **5** can sit only in **E1** or **I1** (strong link): E9 sees E1 on row E, I6 sees I1 on row I.

::board[example_1]

> Since the 5 will occupy one of E1 / I1, one of E9 / I6 must be **9**. Cell **I9** (secondary) sees both wings — E9 on column 9, I6 on row I — so the **9** is removed and I9 is left with {5, 6}.

## How to spot it quickly

Start from two bi-value cells with the **same** pair {A, B}. Look for a value of the pair that has **only two positions** in some group (a strong link) such that one end sees the first cell and the other end sees the second. If you find it, the other value of the pair disappears from every cell that sees both wings.
