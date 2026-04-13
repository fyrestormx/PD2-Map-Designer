import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'

interface FileDropZoneProps {
  title: string
  description: string
  accept?: string
  directory?: boolean
  disabled?: boolean
  buttonLabel: string
  onFiles: (files: File[]) => void
}

export function FileDropZone({
  title,
  description,
  accept,
  directory = false,
  disabled = false,
  buttonLabel,
  onFiles,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const directoryProps: Record<string, string> = directory
    ? {
        webkitdirectory: '',
        directory: '',
      }
    : {}

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    onFiles(Array.from(files))
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) {
      return
    }
    handleFiles(event.dataTransfer.files)
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  return (
    <div
      className={`drop-zone${dragging ? ' dragging' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) {
          setDragging(true)
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setDragging(false)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div>
        <strong>{title}</strong>
        <p className="muted">{description}</p>
      </div>
      <div className="button-row">
        <button
          type="button"
          className="btn-secondary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={accept}
        onChange={onChange}
        {...directoryProps}
      />
    </div>
  )
}
