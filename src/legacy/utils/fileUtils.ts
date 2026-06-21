import { unzipSync, strFromU8 } from 'fflate';
import { ProcessedFile } from '../types';

// Lazy-load pdf.js only in the browser; it depends on DOM globals (DOMMatrix)
// that don't exist in the Worker/SSR runtime and would crash module init.
let pdfjsLibPromise: Promise<any> | null = null;
const loadPdfJs = async () => {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only available in the browser.');
  }
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      const lib = await import('pdfjs-dist/build/pdf.mjs');
      const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
      (lib as any).GlobalWorkerOptions.workerSrc = workerUrl;
      return lib;
    })();
  }
  return pdfjsLibPromise;
};

const MAX_TEXT_CHARS_PER_FILE = 85_000;
const MAX_IMAGE_EDGE_PX = 1500;
const MAX_INLINE_IMAGE_BYTES = 950 * 1024;

const truncateText = (text: string, limit = MAX_TEXT_CHARS_PER_FILE): string => {
  const normalized = text
    .replace(/\u0000/g, '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (normalized.length <= limit) return normalized;

  const headSize = Math.floor(limit * 0.72);
  const tailSize = limit - headSize;
  return `${normalized.slice(0, headSize)}\n\n[بخش میانی سند به دلیل حجم بسیار زیاد حذف شد؛ ادامه انتهای سند:]\n\n${normalized.slice(-tailSize)}`;
};

const getMimeType = (file: File): string => {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'txt': return 'text/plain';
    case 'csv': return 'text/csv';
    case 'xml': return 'text/xml';
    case 'json': return 'application/json';
    case 'md': return 'text/markdown';
    case 'xer': return 'text/plain';
    case 'eml': return 'message/rfc822';
    case 'html': return 'text/html';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc': return 'application/msword';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls': return 'application/vnd.ms-excel';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'msg': return 'application/vnd.ms-outlook';
    case 'mpp': return 'application/vnd.ms-project';
    default: return 'application/octet-stream';
  }
};

const getExtension = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || '';

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => file.arrayBuffer();

export const readFileAsText = (file: File): Promise<string> => file.text();

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

export const readFileAsBase64 = async (file: File): Promise<string> => arrayBufferToBase64(await file.arrayBuffer());

const decodeXmlEntities = (value: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

const xmlToPlainText = (xml: string): string => truncateText(
  decodeXmlEntities(
    xml
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<\/(w:p|a:p|w:tr)>/g, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
);

const extractDocxText = async (file: File): Promise<string> => {
  const zip = unzipSync(new Uint8Array(await readFileAsArrayBuffer(file)));
  const entries = Object.keys(zip).filter((name) => /^word\/(document|header\d+|footer\d+)\.xml$/.test(name));
  const text = entries.map((name) => xmlToPlainText(strFromU8(zip[name]))).join('\n\n');
  return truncateText(text || '[متنی از فایل Word استخراج نشد.]');
};

const extractPptxText = async (file: File): Promise<string> => {
  const zip = unzipSync(new Uint8Array(await readFileAsArrayBuffer(file)));
  const slides = Object.keys(zip)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const text = slides.map((name, index) => `اسلاید ${index + 1}:\n${xmlToPlainText(strFromU8(zip[name]))}`).join('\n\n');
  return truncateText(text || '[متنی از فایل PowerPoint استخراج نشد.]');
};

const extractXlsxText = async (file: File): Promise<string> => {
  const zip = unzipSync(new Uint8Array(await readFileAsArrayBuffer(file)));
  const sharedXml = zip['xl/sharedStrings.xml'] ? strFromU8(zip['xl/sharedStrings.xml']) : '';
  const sharedStrings = Array.from(sharedXml.matchAll(/<si[\s\S]*?<\/si>/g)).map((m) => xmlToPlainText(m[0]));
  const sheets = Object.keys(zip)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const rows = sheets.map((name, sheetIndex) => {
    const xml = strFromU8(zip[name]);
    const cells = Array.from(xml.matchAll(/<c\b([^>]*)>[\s\S]*?<\/c>/g)).slice(0, 2500).map((match) => {
      const attrs = match[1];
      const body = match[0];
      const ref = attrs.match(/r="([^"]+)"/)?.[1] || '';
      const type = attrs.match(/t="([^"]+)"/)?.[1];
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] || body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || '';
      const value = type === 's' ? sharedStrings[Number(raw)] || raw : decodeXmlEntities(raw);
      return `${ref}: ${value}`;
    });
    return `Sheet ${sheetIndex + 1}:\n${cells.join('\n')}`;
  }).join('\n\n');

  return truncateText(rows || '[متنی از فایل Excel استخراج نشد.]');
};

const extractPdfText = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfJs();
  const data = new Uint8Array(await readFileAsArrayBuffer(file));
  const pdf = await (pdfjsLib as any).getDocument({ data, disableFontFace: true, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str || '').join(' ');
    pages.push(`صفحه ${pageNum}:\n${pageText}`);
    if (pages.join('\n').length > MAX_TEXT_CHARS_PER_FILE) break;
  }
  return truncateText(pages.join('\n\n') || '[متنی از PDF استخراج نشد؛ احتمالاً فایل اسکن تصویری است.]');
};

const downscaleImageToBase64 = async (file: File, mimeType: string): Promise<string | undefined> => {
  const bitmap = await createImageBitmap(file);
  try {
    let edge = MAX_IMAGE_EDGE_PX;
    let quality = 0.82;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) return undefined;
      if (blob.size <= MAX_INLINE_IMAGE_BYTES) {
        return arrayBufferToBase64(await blob.arrayBuffer());
      }
      if (attempt === 3) return undefined;
      edge = Math.max(900, Math.round(edge * 0.78));
      quality = Math.max(0.58, quality - 0.08);
    }
    return undefined;
  } finally {
    bitmap.close();
  }
};

const isTextFile = (file: File, detectedMime: string): boolean => {
  const ext = getExtension(file.name);
  if (detectedMime.startsWith('text/') || detectedMime === 'message/rfc822') return true;
  return ['txt', 'csv', 'xml', 'json', 'md', 'xer', 'html', 'log', 'eml'].includes(ext);
};

export const processFiles = async (files: FileList | null, category: string = 'General'): Promise<ProcessedFile[]> => {
  if (!files) return [];
  const processedFiles: ProcessedFile[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (file.name.startsWith('.')) continue;

    try {
      let mimeType = getMimeType(file);
      const ext = getExtension(file.name);
      let base64Data: string | undefined;
      let textContent: string | undefined;

      if (isTextFile(file, mimeType)) {
        textContent = truncateText(await readFileAsText(file));
      } else if (mimeType === 'application/pdf' || ext === 'pdf') {
        textContent = await extractPdfText(file);
      } else if (ext === 'docx') {
        textContent = await extractDocxText(file);
      } else if (ext === 'xlsx') {
        textContent = await extractXlsxText(file);
      } else if (ext === 'pptx') {
        textContent = await extractPptxText(file);
      } else if (mimeType.startsWith('image/')) {
        base64Data = await downscaleImageToBase64(file, mimeType);
        if (base64Data) mimeType = 'image/jpeg';
      } else {
        textContent = `[فایل ${file.name} با فرمت ${mimeType} در مرورگر قابل استخراج مستقیم نیست. لطفاً نسخه PDF متنی، TXT، DOCX، XLSX یا تصویر واضح آن را بارگذاری کنید.]`;
      }

      const pathPart = file.webkitRelativePath || file.name;
      processedFiles.push({
        file,
        base64Data,
        textContent,
        mimeType,
        id: `${category}-${pathPart}-${Date.now()}-${i}`,
        category,
      });
    } catch (error) {
      console.error(`Failed to process file ${file.name}`, error);
    }
  }

  return processedFiles;
};
