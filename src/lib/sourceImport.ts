import JSZip from 'jszip'
import { REQUIRED_TABLES } from './constants'
import { createProjectFromSourceBundle } from './project'
import { parseTsv } from './tsv'
import type {
  ImportOrigin,
  LoadedImportFile,
  SourceBundle,
  SourceTable,
  ValidationIssue,
} from '../types/map'

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '')
}

function getExtension(path: string): string {
  const match = /\.[a-z0-9]+$/i.exec(path)
  return match ? match[0].toLowerCase() : ''
}

function tableIssue(message: string, path?: string): ValidationIssue {
  return {
    id: `import-${Math.random().toString(36).slice(2, 10)}`,
    severity: 'warning',
    code: 'import.issue',
    message,
    path,
  }
}

async function loadTextFile(file: File, path: string): Promise<LoadedImportFile> {
  return {
    path,
    name: file.name,
    extension: getExtension(file.name),
    size: file.size,
    lastModified: file.lastModified,
    kind: 'text',
    text: await file.text(),
  }
}

async function loadBinaryFile(file: File, path: string): Promise<LoadedImportFile> {
  return {
    path,
    name: file.name,
    extension: getExtension(file.name),
    size: file.size,
    lastModified: file.lastModified,
    kind: 'binary',
  }
}

async function loadZipFile(file: File): Promise<LoadedImportFile[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const entries = Object.values(zip.files).filter((entry) => !entry.dir)
  const results: LoadedImportFile[] = []

  for (const entry of entries) {
    const path = normalizePath(entry.name)
    const extension = getExtension(path)
    if (extension === '.txt' || extension === '.json' || extension === '.md') {
      const text = await entry.async('string')
      results.push({
        path,
        name: path.split('/').pop() ?? path,
        extension,
        size: text.length,
        lastModified: Date.now(),
        kind: 'text',
        text,
      })
    } else {
      const bytes = await entry.async('uint8array')
      results.push({
        path,
        name: path.split('/').pop() ?? path,
        extension,
        size: bytes.byteLength,
        lastModified: Date.now(),
        kind: 'binary',
      })
    }
  }

  return results
}

export async function loadFilesFromSelection(files: File[]): Promise<{ files: LoadedImportFile[]; origin: ImportOrigin }> {
  if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
    return {
      files: await loadZipFile(files[0]),
      origin: 'zip',
    }
  }

  const loaded = await Promise.all(
    files.map(async (file) => {
      const path = normalizePath(file.webkitRelativePath || file.name)
      const extension = getExtension(path)
      return extension === '.txt' || extension === '.json' || extension === '.md'
        ? loadTextFile(file, path)
        : loadBinaryFile(file, path)
    }),
  )

  return {
    files: loaded,
    origin: 'folder',
  }
}

function extractSourceTable(file: LoadedImportFile): SourceTable | undefined {
  if (file.kind !== 'text' || !file.text) {
    return undefined
  }

  const parsed = parseTsv(file.text)
  return {
    name: file.name,
    path: file.path,
    headers: parsed.headers,
    rows: parsed.rows,
    text: file.text,
  }
}

export function buildWorkspaceFromLoadedFiles(files: LoadedImportFile[], origin: ImportOrigin) {
  const issues: ValidationIssue[] = []
  const tables: Record<string, SourceTable> = {}
  const ds1Files = files
    .filter((file) => file.extension === '.ds1')
    .map((file) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      linkedPresetIds: [] as string[],
    }))

  for (const file of files) {
    const table = extractSourceTable(file)
    if (!table) {
      continue
    }

    const requiredName = REQUIRED_TABLES.find((tableName) => tableName.toLowerCase() === file.name.toLowerCase())
    if (requiredName) {
      tables[requiredName] = table
    }
  }

  REQUIRED_TABLES.forEach((tableName) => {
    if (!tables[tableName]) {
      issues.push(tableIssue(`Missing ${tableName}. Import the extracted excel table before export.`, tableName))
    }
  })

  if (ds1Files.length === 0) {
    issues.push(tableIssue('No DS1 files were detected. You can still prepare table data, but room composition will be limited.'))
  }

  const sourceBundle: SourceBundle = {
    origin,
    importedAt: new Date().toISOString(),
    tables,
    ds1Files,
    rawFiles: files.map((file) => ({
      path: file.path,
      kind: file.kind,
      size: file.size,
    })),
    issues,
  }

  const project = createProjectFromSourceBundle(sourceBundle)
  return { sourceBundle, project }
}
