import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';

const JPEG_OPTIONS = {
  quality: 0.92,
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: '#ffffff',
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, data] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function sanitizeFilename(value: string) {
  return value.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'timesheet';
}

function sheetFilename(sheet: HTMLElement, index: number) {
  const name =
    sheet.getAttribute('data-export-name')
    || sheet.querySelector('[data-export-label]')?.textContent
    || `sheet-${index + 1}`;
  return `${sanitizeFilename(name)}.jpg`;
}

async function captureSheet(sheet: HTMLElement) {
  return toJpeg(sheet, {
    ...JPEG_OPTIONS,
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return !node.classList.contains('no-jpeg-export');
    },
  });
}

/** Capture one or more official timesheet sheets and download as JPEG (or ZIP). */
export async function exportTimesheetSheetsAsJpeg(
  roots: HTMLElement[],
  baseName = 'quadrant-care-timesheets',
) {
  const sheets = roots.flatMap((root) =>
    root.classList.contains('official-timesheet')
      ? [root]
      : [...root.querySelectorAll<HTMLElement>('.official-timesheet')],
  );

  if (!sheets.length) {
    throw new Error('No timesheet sheet is available to export.');
  }

  document.documentElement.classList.add('exporting-jpeg');
  try {
    // Allow layout/CSS (hidden edit chrome) to settle before capture.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    if (sheets.length === 1) {
      const dataUrl = await captureSheet(sheets[0]);
      saveBlob(dataUrlToBlob(dataUrl), `${sanitizeFilename(baseName)}.jpg`);
      return;
    }

    const zip = new JSZip();
    const usedNames = new Set<string>();
    for (let i = 0; i < sheets.length; i += 1) {
      const dataUrl = await captureSheet(sheets[i]);
      let filename = sheetFilename(sheets[i], i);
      if (usedNames.has(filename)) {
        filename = `${filename.replace(/\.jpg$/i, '')}-${i + 1}.jpg`;
      }
      usedNames.add(filename);
      zip.file(filename, dataUrlToBlob(dataUrl));
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveBlob(zipBlob, `${sanitizeFilename(baseName)}-jpeg.zip`);
  } finally {
    document.documentElement.classList.remove('exporting-jpeg');
  }
}
