/** Resize and compress an image in the browser to save Supabase Storage quota. */
export async function compressImageFile(
  file: File,
  options: {
    maxWidth: number;
    maxHeight: number;
    maxBytes: number;
    mimeType?: "image/webp" | "image/jpeg";
  }
): Promise<Blob> {
  const mimeType = options.mimeType ?? "image/webp";
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    options.maxWidth / bitmap.width,
    options.maxHeight / bitmap.height
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.82;
  let blob = await canvasToBlob(canvas, mimeType, quality);
  while (blob.size > options.maxBytes && quality > 0.35) {
    quality -= 0.12;
    blob = await canvasToBlob(canvas, mimeType, quality);
  }
  if (blob.size > options.maxBytes) {
    throw new Error(
      `Image still too large after compression (${Math.round(blob.size / 1024)}KB). Use an external image URL instead.`
    );
  }
  return blob;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      type,
      quality
    );
  });
}
