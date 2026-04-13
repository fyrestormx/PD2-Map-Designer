import type { LoadedImportFile } from '../types/map'

function makeTextFile(path: string, text: string): LoadedImportFile {
  return {
    path,
    name: path.split(/[\\/]/).pop() ?? path,
    extension: path.split('.').pop()?.toLowerCase() ? `.${path.split('.').pop()?.toLowerCase()}` : '',
    size: text.length,
    lastModified: Date.now(),
    kind: 'text',
    text,
  }
}

function makeBinaryPlaceholder(path: string, size = 4096): LoadedImportFile {
  return {
    path,
    name: path.split(/[\\/]/).pop() ?? path,
    extension: '.ds1',
    size,
    lastModified: Date.now(),
    kind: 'binary',
  }
}

export function getDemoImportFiles(): LoadedImportFile[] {
  return [
    makeTextFile(
      'global/excel/Levels.txt',
      [
        'Name\tId\tLevelType\tSubType\tMonLvlEx\tMonDen',
        'Ember March\t900\t37\t0\t89\t65000',
      ].join('\r\n'),
    ),
    makeTextFile(
      'global/excel/LvlMaze.txt',
      [
        'Name\tLevel\tRooms\tRooms(N)\tRooms(H)\tSizeX\tSizeY\tMerge',
        'Ember March\t900\t7\t8\t9\t4\t4\t780',
      ].join('\r\n'),
    ),
    makeTextFile(
      'global/excel/LvlPrest.txt',
      [
        'Name\tDef\tLevelId\tPopulate\tOutdoors\tSizeX\tSizeY\tScan\tFiles\tFile1\tDt1Mask',
        'Ember Gate\t2001\t900\t1\t1\t10\t8\t1\t1\tdata/global/tiles/maps/PD2/ember_gate.ds1\t3',
        'Ash Corridor\t2002\t900\t1\t0\t12\t6\t0\t1\tdata/global/tiles/maps/PD2/ash_corridor.ds1\t3',
        'Infernal Court\t2003\t900\t1\t1\t16\t14\t1\t1\tdata/global/tiles/maps/PD2/infernal_court.ds1\t3',
      ].join('\r\n'),
    ),
    makeTextFile(
      'global/excel/LvlTypes.txt',
      [
        'Name\tID\tFile 1\tFile 2\tAct',
        'Hell Wastes\t37\tdata/global/tiles/hellwastes_1.dt1\tdata/global/tiles/hellwastes_2.dt1\t5',
      ].join('\r\n'),
    ),
    makeBinaryPlaceholder('data/global/tiles/maps/PD2/ember_gate.ds1'),
    makeBinaryPlaceholder('data/global/tiles/maps/PD2/ash_corridor.ds1'),
    makeBinaryPlaceholder('data/global/tiles/maps/PD2/infernal_court.ds1'),
    makeBinaryPlaceholder('data/global/tiles/maps/PD2/bonus_room.ds1'),
  ]
}
