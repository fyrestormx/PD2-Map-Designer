# Engine model

This app follows the Diablo II level-data model instead of inventing a separate map format.

## Main table roles

- `Levels.txt`
  - Defines the area or level entry.
  - Holds level id, level type, subtype, monster density, and related area rules.
- `LvlMaze.txt`
  - Controls random room counts and room sizes for maze-style assembly.
- `LvlPrest.txt`
  - Connects preset definitions to one or more DS1 files.
  - Holds size, scan, and `Dt1Mask` values used during preset assembly.
- `LvlTypes.txt`
  - Defines which DT1 tile sets belong to each level type.

## How the app uses those files

1. Import reads the required text tables and DS1 file list.
2. Room Library turns `LvlPrest` rows and DS1 paths into editable room templates.
3. Composer places room templates on a logical grid.
4. Generator builds seeded room placements from tagged templates.
5. Validation checks table links, file references, connectors, warp ids, and basic `Dt1Mask` safety.
6. Export writes updated `Levels.txt`, `LvlMaze.txt`, `LvlPrest.txt`, a project JSON, and a report.

## Current limits

- DS1 binary content is not modified in v1.
- `Dt1Mask` validation is conservative, not a full engine simulation.
- Export focuses on consistent helper files for extracted workflows, not direct MPQ patching.
