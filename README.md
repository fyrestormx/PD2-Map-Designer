# PD2 Map Designer

Browser app for planning Project Diablo 2 maps with a simple visual workflow first.

## Main flow

- `Quick Start`: choose a theme, place rooms and corridors, review the route, export the planner file.
- `Advanced Mode`: import extracted `txt` and `ds1` files, edit room bindings, run raw validation, and build PD2 table exports.

## What it does

- Starts with a blank visual map builder. No extracted files are required to begin.
- Lets you place rooms, corridors, junctions, entrances, exits, and boss rooms on a snapped grid.
- Shows open or mismatched connections in plain language.
- Saves a planner JSON at any time.
- Unlocks PD2-ready export after imported bindings are present and valid.

## What it does not do yet

- It does not edit MPQ archives.
- It does not paint raw tiles.
- It does not rewrite DS1 binary contents.
- It uses simple placeholder theme previews, not real game art previews.

## How to make your first map

1. Install packages.

```bash
npm install
```

2. Start the app.

```bash
npm run dev
```

3. Open the app and click `Start blank map`.
4. Pick a theme in `Theme`.
5. In `Build`, choose a piece on the left and click cells to place it.
6. Select placed pieces to rename them, rotate them, duplicate them, or delete them.
7. Open `Review` to check route warnings and export blockers.
8. Open `Export` to save the planner JSON.

## Import real PD2 data

Use `Advanced Mode` when you want PD2-ready table export.

Required extracted tables:

- `Levels.txt`
- `LvlMaze.txt`
- `LvlPrest.txt`
- `LvlTypes.txt`

Optional imported data:

- `ds1` room files for real room bindings and advanced palette pieces

## Scripts

```bash
# start the dev server
npm run dev

# run unit and component tests
npm test

# run lint
npm run lint

# build the production bundle
npm run build

# run the Playwright smoke test
npm run test:e2e
```

## GitHub Pages

This repo deploys with GitHub Actions.

If Pages is not enabled yet for a fork:

1. Open GitHub repo `Settings`.
2. Click `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` again.

The site for this repo should publish at:

- [PD2 Map Designer Demo](https://fyrestormx.github.io/PD2-Map-Designer/)

## Core references

- [PD2 Map Pathing Guide](https://maaaaaarrk.github.io/Hiim-PD2-Resources/maps.html)
- [Project Diablo 2 Maps Wiki](https://wiki.projectdiablo2.com/wiki/Maps)
- [D2R Data Guide](https://d2r-gimli.github.io/D2R_DataGuide/)
- [Diablo II Data File Guide](https://d2r-gimli.github.io/diabloiidatafileguide/)
