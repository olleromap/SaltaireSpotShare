/**
 * 2-D grid layouts for each parking floor.
 * null  = empty cell (drive aisle, wall, non-parking area)
 * number = spot number within that floor (e.g. 15 → R6-15)
 *
 * Orientation: row 0 = north, last row = south; col 0 = west, last col = east.
 * All rows must be the same length (pad with null).
 */
export type FloorGrid = (number | null)[][];

// ---------------------------------------------------------------------------
// Floor 6  (73 spots)
// West column   : R6-1  … R6-13  (col 1, rows 0-13; spot 13 also anchors south row)
// South row     : R6-13 … R6-29  (row 14, cols 1-17)
// Sector-A col  : R6-30 … R6-40  (col 14, rows 2-12)
// Top-right pair: R6-41, R6-42  (row 0, cols 13-14 – adjacent to Sector A boundary)
// Interior rows (Sector B):
//   Upper pair  : R6-43–48 (N-facing, row 1) / R6-49–53 (S-facing, row 2)
//   Mid-upper   : R6-64–68 (N-facing, row 5) / R6-69–73 (S-facing, row 6)
//   Mid-lower   : R6-54–58 (N-facing, row 8) / R6-59–63 (S-facing, row 9)
// ---------------------------------------------------------------------------
const FLOOR_6: FloorGrid = [
  // row 0 – north end (pool/spa above; only spots 41-42 near Sector-A boundary)
  //   0      1      2      3      4      5      6      7      8      9     10     11     12     13     14     15     16     17
  [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    41,    42,  null,  null,  null],

  // row 1 – left col R6-1; upper interior N-facing R6-43…48
  [null,     1,  null,    43,    44,    45,    46,    47,    48,  null,  null,  null,  null,  null,  null,  null,  null,  null],

  // row 2 – R6-2; upper interior S-facing R6-49…53; Sector-A col starts R6-30
  [null,     2,  null,    49,    50,    51,    52,    53,  null,  null,  null,  null,  null,  null,    30,  null,  null,  null],

  // row 3 – R6-3; R6-31
  [null,     3,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    31,  null,  null,  null],

  // row 4 – drive aisle
  [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],

  // row 5 – R6-4; mid-upper N-facing R6-64…68; R6-32
  [null,     4,  null,  null,  null,  null,  null,    64,    65,    66,    67,    68,  null,  null,    32,  null,  null,  null],

  // row 6 – R6-5; mid-upper S-facing R6-69…73; R6-33
  [null,     5,  null,  null,  null,  null,  null,    69,    70,    71,    72,    73,  null,  null,    33,  null,  null,  null],

  // row 7 – R6-6 (aisle between interior groups); R6-34
  [null,     6,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    34,  null,  null,  null],

  // row 8 – R6-7; mid-lower N-facing R6-54…58; R6-35
  [null,     7,  null,    54,    55,    56,    57,    58,  null,  null,  null,  null,  null,  null,    35,  null,  null,  null],

  // row 9 – R6-8; mid-lower S-facing R6-59…63; R6-36
  [null,     8,  null,    59,    60,    61,    62,    63,  null,  null,  null,  null,  null,  null,    36,  null,  null,  null],

  // row 10 – R6-9; R6-37
  [null,     9,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    37,  null,  null,  null],

  // row 11 – R6-10; R6-38
  [null,    10,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    38,  null,  null,  null],

  // row 12 – R6-11; R6-39
  [null,    11,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    39,  null,  null,  null],

  // row 13 – R6-12; R6-40
  [null,    12,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    40,  null,  null,  null],

  // row 14 – south row: R6-13 anchors left col, then R6-14…R6-29 run east
  [null,    13,    14,    15,    16,    17,    18,    19,    20,    21,    22,    23,    24,    25,    26,    27,    28,    29],
];

export const FLOOR_LAYOUTS: Record<number, FloorGrid | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: FLOOR_6,
};
