import { useCallback } from 'react';
import { triggerDownload, getOutputFilename } from '@/lib/utils/download';

export function useDownload(originalName: string = 'imagen') {
  const download = useCallback((blob: Blob, suffix: string, extension?: string) => {
    const filename = getOutputFilename(originalName, suffix, extension);
    triggerDownload(blob, filename);
  }, [originalName]);

  return { download };
}
