import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { get, put } from '@vercel/blob';
import { platformQuery, platformRun } from './platform-store';
import { readS3Object, s3Configured, s3PublicUrl, writeS3Object } from './s3-storage';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export interface UploadRecord {
  id: string;
  ownerId: string;
  kind: string;
  filename: string;
  storageKey: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  visibility: 'public' | 'private';
  createdAt: string;
}

interface UploadRow {
  id: string;
  owner_id: string;
  kind: string;
  filename: string;
  storage_key: string;
  url: string;
  content_type: string;
  size_bytes: number;
  visibility: 'public' | 'private';
  created_at: string;
}

function mapUpload(row: UploadRow): UploadRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    kind: row.kind,
    filename: row.filename,
    storageKey: row.storage_key,
    url: row.url,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(-120) || 'upload';
}

function validSignature(bytes: Uint8Array, type: string) {
  if (type === 'application/pdf') return new TextDecoder().decode(bytes.slice(0, 4)) === '%PDF';
  if (type === 'image/png')
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/webp') {
    const signature = new TextDecoder().decode(bytes.slice(0, 12));
    return signature.startsWith('RIFF') && signature.endsWith('WEBP');
  }
  return false;
}

function localDirectory() {
  return process.env.DO_IT_NOW_DATA_DIR
    ? path.join(path.resolve(process.env.DO_IT_NOW_DATA_DIR), 'uploads')
    : path.join(process.cwd(), 'data', 'uploads');
}

export async function saveUpload(
  file: File,
  ownerId: string,
  kind: 'brief' | 'design' | 'portal' | 'story',
  visibility: 'public' | 'private',
): Promise<UploadRecord> {
  if (!allowedTypes.has(file.type)) throw new Error('Use a JPEG, PNG, WebP or PDF file.');
  if ((kind === 'design' || kind === 'story') && !file.type.startsWith('image/'))
    throw new Error('Design uploads must be images.');
  if (file.size < 20 || file.size > MAX_UPLOAD_BYTES)
    throw new Error('Files must be between 20 bytes and 4 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validSignature(bytes, file.type)) throw new Error('The file contents do not match its declared type.');

  const id = randomUUID();
  const filename = safeFilename(file.name);
  const storageKey = `do-it-now/${kind}/${id}-${filename}`;
  let url = `/api/files/${id}`;
  let persistedStorageKey = storageKey;
  if (s3Configured()) {
    persistedStorageKey = await writeS3Object(storageKey, bytes, file.type, visibility);
    if (visibility === 'public') url = s3PublicUrl(persistedStorageKey) || url;
  } else if (process.env.VERCEL === '1') {
    const token =
      visibility === 'private'
        ? process.env.BLOB_PRIVATE_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
        : process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error('Blob upload credentials are not configured.');
    const result = await put(storageKey, Buffer.from(bytes), {
      access: visibility,
      token,
      contentType: file.type,
      addRandomSuffix: false,
    });
    url = result.url;
  } else {
    await mkdir(localDirectory(), { recursive: true });
    await writeFile(path.join(localDirectory(), id), bytes);
  }
  const createdAt = new Date().toISOString();
  await platformRun(
    `INSERT INTO uploads (id, owner_id, kind, filename, storage_key, url, content_type,
      size_bytes, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ownerId, kind, filename, persistedStorageKey, url, file.type, file.size, visibility, createdAt],
  );
  return {
    id,
    ownerId,
    kind,
    filename,
    storageKey: persistedStorageKey,
    url,
    contentType: file.type,
    sizeBytes: file.size,
    visibility,
    createdAt,
  };
}

export async function getUpload(id: string) {
  const rows = await platformQuery<UploadRow>('SELECT * FROM uploads WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? mapUpload(rows[0]) : null;
}

export async function listUploads(ownerId: string, kind?: string) {
  const rows = kind
    ? await platformQuery<UploadRow>(
        'SELECT * FROM uploads WHERE owner_id = ? AND kind = ? ORDER BY created_at DESC',
        [ownerId, kind],
      )
    : await platformQuery<UploadRow>('SELECT * FROM uploads WHERE owner_id = ? ORDER BY created_at DESC', [
        ownerId,
      ]);
  return rows.map(mapUpload);
}

export async function attachUploads(ownerId: string, enquiryId: string) {
  await platformRun("UPDATE uploads SET owner_id = ? WHERE owner_id = ? AND kind = 'brief'", [
    enquiryId,
    ownerId,
  ]);
}

export async function readUpload(upload: UploadRecord) {
  if (upload.storageKey.startsWith('s3://')) return readS3Object(upload.storageKey);
  if (process.env.VERCEL === '1') {
    const token =
      upload.visibility === 'private'
        ? process.env.BLOB_PRIVATE_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
        : process.env.BLOB_READ_WRITE_TOKEN;
    const result = await get(upload.storageKey, { access: upload.visibility, token, useCache: false });
    if (result?.statusCode !== 200) return null;
    return { stream: result.stream, bytes: null, contentType: result.blob.contentType };
  }
  const bytes = await readFile(path.join(localDirectory(), upload.id));
  return { stream: null, bytes, contentType: upload.contentType };
}
