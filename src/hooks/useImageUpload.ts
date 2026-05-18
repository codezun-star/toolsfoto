import { useState, useCallback } from 'react';
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from '@/lib/constants/tools';
import { fileToObjectURL, revokeURL } from '@/lib/utils/canvas';

export interface ImageFile {
  file: File;
  url: string;
  width: number;
  height: number;
}

export function useImageUpload() {
  const [image, setImage] = useState<ImageFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato no soportado. Acepta JPG, PNG, WebP, AVIF y GIF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo supera el límite de 50 MB.');
      return;
    }

    const url = fileToObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (image?.url) revokeURL(image.url);
      setImage({ file, url, width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      revokeURL(url);
      setError('No se pudo leer la imagen. Verifica que el archivo no esté dañado.');
    };

    img.src = url;
  }, [image]);

  const clearImage = useCallback(() => {
    if (image?.url) revokeURL(image.url);
    setImage(null);
    setError(null);
  }, [image]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  return { image, error, isDragging, processFile, clearImage, onDrop, onDragOver, onDragLeave, onFileChange };
}
