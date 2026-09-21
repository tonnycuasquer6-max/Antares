const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) || 'du0woxeqh';
const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) || '';

export async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  if (!uploadPreset) {
    throw new Error('Falta configurar VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json() as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'Cloudinary no pudo subir el archivo.');
  }

  return result.secure_url;
}