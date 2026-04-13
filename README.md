# PD2 Map Designer

Browser app for building and validating Project Diablo 2 map layouts from extracted game data.

## What it does

- Imports user-owned extracted `Levels.txt`, `LvlMaze.txt`, `LvlPrest.txt`, `LvlTypes.txt`, and DS1 files.
- Builds a room library from `LvlPrest` and DS1 references.
- Lets you place rooms on a snapped grid and edit map metadata.
- Generates seeded room layouts from tagged templates.
- Validates common problems before export.
- Exports updated table files, a project JSON, and a readable report.

## What it does not do yet

- It does not edit MPQ archives.
- It does not paint raw tiles.
- It does not rewrite DS1 binary contents.

## Quick start

```bash
# install packages
npm install

# run the dev app
npm run dev

# run unit and component tests
npm test

# build the production bundle
npm run build
```

## Demo workflow

1. Open the app.
2. Click `Load demo workspace`.
3. Review the imported room library.
4. Place rooms in `Composer` or generate candidates in `Generator`.
5. Open `Validation`.
6. Build files in `Export`.

## Import requirements

- Use extracted plain files, not MPQ archives.
- Include these tables:
  - `Levels.txt`
  - `LvlMaze.txt`
  - `LvlPrest.txt`
  - `LvlTypes.txt`
- Include DS1 files if you want room composition and generation.

## Scripts

```bash
# run Vitest
npm test

# run Playwright smoke test
npm run test:e2e

# preview the built app
npm run preview
```

## Deploy

GitHub Pages deployment is set up in `.github/workflows/deploy.yml`.

## Core references

- [PD2 Map Pathing Guide](https://maaaaaarrk.github.io/Hiim-PD2-Resources/maps.html)
- [Project Diablo 2 Maps Wiki](https://wiki.projectdiablo2.com/wiki/Maps)
- [D2R Data Guide](https://d2r-gimli.github.io/D2R_DataGuide/)
- [Diablo II Data File Guide](https://d2r-gimli.github.io/diabloiidatafileguide/)
