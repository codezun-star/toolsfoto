export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getOutputFilename(
  originalName: string,
  suffix: string,
  extension?: string,
): string {
  const dot = originalName.lastIndexOf('.');
  const base = dot !== -1 ? originalName.slice(0, dot) : originalName;
  const ext = extension ?? (dot !== -1 ? originalName.slice(dot + 1) : 'png');
  return `${base}-${suffix}.${ext}`;
}
