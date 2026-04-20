// singoli solver
export * from './OneCellForValue.algorithm';    // priority 0
export * from './OneValueForCell.algorithm';    // priority 1
// naked subsets
export * from './Twins.algorithm';              // priority 2 (naked pair)
export * from './NakedTriple.algorithm';        // priority 5
export * from './NakedQuad.algorithm';          // priority 7
// hidden subsets
export * from './HiddenPair.algorithm';         // priority 3
export * from './HiddenTriple.algorithm';       // priority 6
export * from './HiddenQuad.algorithm';         // priority 8
// intersection / chains
export * from './AlignmentOnGroup.algorithm';   // priority 4 (pointing / claiming)
export * from './Couples.algorithm';            // priority 10
// fish
export * from './XWings.algorithm';             // priority 9
export * from './Swordfish.algorithm';          // priority 12
export * from './Jellyfish.algorithm';          // priority 15
// wings & uniqueness
export * from './XYWings.algorithm';            // priority 11
export * from './UniqueRectangle.algorithm';    // priority 13
export * from './SimpleColouring.algorithm';    // priority 14
export * from './TurbotFish.algorithm';         // priority 16 (ex Chains)
// endgame
export * from './Bug.algorithm';                // priority 20
// brute force
export * from './TryNumber.algorithm';          // priority 100
