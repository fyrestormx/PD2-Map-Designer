import JSZip from 'jszip'
import type { ExportBundle, ExportTextFile } from '../types/map'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadTextFile(filename: string, content: string): void {
  triggerDownload(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename)
}

export async function downloadTextArchive(files: ExportTextFile[], archiveName: string): Promise<void> {
  const zip = new JSZip()
  files.forEach((file) => {
    zip.file(file.name, file.content)
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, `${archiveName}.zip`)
}

export async function downloadExportBundle(bundle: ExportBundle, archiveName: string): Promise<void> {
  await downloadTextArchive(bundle.files, archiveName)
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
