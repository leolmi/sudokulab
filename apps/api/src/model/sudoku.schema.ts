import * as mongoose from 'mongoose';


export const SudokuOptionsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locked: { type: Boolean, default: false},
  editable: { type: Boolean, default: true }
});

export const SudokuAlgorithmResult = new mongoose.Schema({
  algorithm: { type: String, required: true },
  cases: [{ type: mongoose.Schema.Types.Mixed }],
  cells: [String],
  applied: { type: Boolean, default: false}
});

export const SudokuInfoSchema = new mongoose.Schema({
  symmetry: String,
  difficulty: String,
  compiled: { type: Boolean, default: false},
  unique: { type: Boolean, default: false},
  sudokulab: { type: Boolean, default: false},
  useTryAlgorithm: { type: Boolean, default: false},
  algorithms: [SudokuAlgorithmResult],
  difficultyMap: { type: mongoose.Schema.Types.Mixed },
  difficultyValue: { type: Number, default: 0 }
});

export const SudokuSchema = new mongoose.Schema({
  _id: { type: Number, required: true },
  rank: { type: Number, required: true },
  values: { type: String, required: true },
  fixed: { type: String, required: true },
  options: SudokuOptionsSchema,
  info: SudokuInfoSchema
});
