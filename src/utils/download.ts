import { toast } from 'sonner';
import type { AxiosResponse } from 'axios';

function filenameFromDisposition(header?: string, fallback = 'download') {
  if (!header) return fallback;
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf?.[1]) return decodeURIComponent(utf[1].trim().replace(/^"|"$/g, ''));
  const plain = /filename="?([^";]+)"?/i.exec(header);
  if (plain?.[1]) return plain[1].trim();
  return fallback;
}

async function blobErrorMessage(blob: Blob) {
  try {
    const text = await blob.text();
    const json = JSON.parse(text) as { message?: string };
    return json.message || 'Download failed.';
  } catch {
    return 'Download failed.';
  }
}

/** Trigger a browser file download from an axios blob response. */
export async function saveAxiosBlob(
  response: AxiosResponse<Blob>,
  fallbackFilename: string,
) {
  const data = response.data;
  const contentType = String(response.headers['content-type'] ?? '');
  if (contentType.includes('application/json') || (data.type && data.type.includes('application/json'))) {
    throw new Error(await blobErrorMessage(data));
  }
  if (!data || data.size === 0) {
    throw new Error('The download was empty. Please try again.');
  }

  const filename = filenameFromDisposition(
    response.headers['content-disposition'] as string | undefined,
    fallbackFilename,
  );
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadWithToast(action: () => Promise<void>, successMessage: string) {
  try {
    await action();
    toast.success(successMessage);
  } catch (error) {
    const err = error as { message?: string; response?: { data?: Blob | { message?: string } } };
    let message = err?.message || 'Download failed.';
    const data = err?.response?.data;
    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text()) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        /* keep message */
      }
    } else if (data && typeof data === 'object' && data.message) {
      message = data.message;
    }
    toast.error(message);
  }
}
