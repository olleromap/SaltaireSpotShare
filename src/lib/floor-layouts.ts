/**
 * 2-D grid layouts for each parking floor.
 * null  = empty cell (drive aisle, wall, non-parking area)
 * number = spot number within that floor (e.g. 15 → R6-15)
 *
 * Orientation: row 0 = north, last row = south; col 0 = west, last col = east.
 * All rows must be the same length (24 cols, pad short rows with null).
 */
export type FloorGrid = (number | null)[][];

// ---------------------------------------------------------------------------
// Floor 6  (73 spots)
//
// West column (col 1) — confirmed pairing from user:
//   Pairs:   1+2,  3+4,  6+7,  8+9,  10+11,  12+13
//   Single:  5
//   Small gap between each group (no major cross-aisle in west col)
//
// South row (row 20): R6-14 … R6-29 running west→east, with gaps between groups:
//   14 (solo), gap, 15-16-17, gap, 18-19, gap, 20-21-22, gap, 23-24-25, gap, 26-27-28, gap, 29 (solo)
// Sector-A col (col 14): R6-30 … R6-40 running north→south
// Top-right pair: R6-41, R6-42 (row 0, cols 12-13)
// Interior Sector-B rows (approximate — to be refined with more plans):
//   Upper pair : R6-43–48 (N-facing, row 1) / R6-49–53 (S-facing, row 2)
//   Mid-upper  : R6-64–68 (N-facing, row 7) / R6-69–73 (S-facing, row 8)
//   Mid-lower  : R6-54–58 (N-facing, row 11) / R6-59–63 (S-facing, row 12)
// ---------------------------------------------------------------------------
const FLOOR_6: FloorGrid = [
  //        0      1      2      3      4      5      6      7      8      9     10     11     12     13     14     15     16     17     18     19     20     21     22     23
  // row 0 – R6-1; top-right R6-41 & R6-42
  [null,     1,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    41,    42,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 1 – R6-2 (paired with 1); interior upper N-facing R6-43…48
  [null,     2,  null,    43,    44,    45,    46,    47,    48,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 2 – gap; interior S-facing R6-49…53; Sector-A R6-30
  [null,  null,  null,    49,    50,    51,    52,    53,  null,  null,  null,  null,  null,  null,    30,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 3 – R6-3; Sector-A R6-31
  [null,     3,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    31,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 4 – R6-4 (paired with 3); Sector-A R6-32
  [null,     4,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    32,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 5 – gap; Sector-A R6-33
  [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    33,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 6 – R6-5 (single); Sector-A R6-34
  [null,     5,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    34,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 7 – gap; interior mid-upper N-facing R6-64…68; Sector-A R6-35
  [null,  null,  null,  null,  null,  null,  null,    64,    65,    66,    67,    68,  null,  null,    35,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 8 – R6-6; interior mid-upper S-facing R6-69…73; Sector-A R6-36
  [null,     6,  null,  null,  null,  null,  null,    69,    70,    71,    72,    73,  null,  null,    36,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 9 – R6-7 (paired with 6); Sector-A R6-37
  [null,     7,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    37,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 10 – gap; Sector-A R6-38
  [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,    38,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 11 – R6-8; interior mid-lower N-facing R6-54…58; Sector-A R6-39
  [null,     8,  null,    54,    55,    56,    57,    58,  null,  null,  null,  null,  null,  null,    39,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 12 – R6-9 (paired with 8); interior mid-lower S-facing R6-59…63; Sector-A R6-40
  [null,     9,  null,    59,    60,    61,    62,    63,  null,  null,  null,  null,  null,  null,    40,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 13 – gap
  [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 14 – R6-10
  [null,    10,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 15 – R6-11 (paired with 10)
  [null,    11,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 16 – gap
  [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 17 – R6-12
  [null,    12,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 18 – R6-13 (paired with 12)
  [null,    13,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 19 – gap before south row
  [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null],
  // row 20 – south row: 14 (solo) · gap · 15-16-17 · gap · 18-19 · gap · 20-21-22 · gap · 23-24-25 · gap · 26-27-28 · gap · 29 (solo)
  [null,  null,    14,  null,    15,    16,    17,  null,    18,    19,  null,    20,    21,    22,  null,    23,    24,    25,  null,    26,    27,    28,  null,    29],
];

export const FLOOR_LAYOUTS: Record<number, FloorGrid | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: FLOOR_6,
};
