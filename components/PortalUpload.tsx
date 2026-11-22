'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, LoaderCircle } from 'lucide-react';

export default function PortalUpload({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function upload() {
    if (!file) return;
    setPending(true);
    setMessage('');
    try {
      const body = new FormData();
      body.set('projectId', projectId);
      body.set('file', file);
      const response = await fetch('/api/portal/uploads', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'The file could not be uploaded.');
      setMessage(`${data.file.filename} was added to this project.`);
      setFile(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The file could not be uploaded.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="portal-upload">
      <FileUp size={22} />
      <div>
        <strong>Add a reference or revision file</strong>
        <p>JPEG, PNG, WebP or PDF · maximum 4 MB.</p>
      </div>
      <input
        aria-label="Customer project file"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(event) => {
          setFile(event.target.files?.[0] || null);
          setMessage('');
        }}
      />
      <button type="button" className="button button-secondary" disabled={!file || pending} onClick={upload}>
        {pending ? <LoaderCircle className="spin" size={16} /> : <FileUp size={16} />} Upload securely
      </button>
      {message && (
        <div className="portal-message" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
