// singoli solver
export * from './OneCellForValue.algorithm';    // priority 0
export * from './OneValueForCell.algorithm';    // priority 1
// naked subsets
export * from './Twins.algorithm';              // priority 2 (naked pair)
export * from './NakedTriple.algorithm';        // priority 4
export * from './NakedQuad.algorithm';          // priority 6
// hidden subsets
export * from './HiddenTriple.algorithm';       // priority 5
export * from './HiddenQuad.algorithm';         // priority 7
// intersection / chains
export * from './AlignmentOnGroup.algorithm';   // priority 3 (pointing / claiming)
export * from './Couples.algorithm';            // priority 9
// fish
export * from './XWings.algorithm';             // priority 8
export * from './Swordfish.algorithm';          // priority 11
export * from './Jellyfish.algorithm';          // priority 14
// wings & uniqueness
export * from './XYWings.algorithm';            // priority 10
export * from './UniqueRectangle.algorithm';    // priority 12
export * from './SimpleColouring.algorithm';    // priority 13
export * from './TurbotFish.algorithm';         // priority 15 (ex Chains)
// endgame
export * from './Bug.algorithm';                // priority 16
// brute force
export * from './TryNumber.algorithm';          // priority 100 (brute force: tenuto volutamente distante)
