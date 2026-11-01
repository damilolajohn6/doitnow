import { Download, ExternalLink, FileImage, FileText, Package } from 'lucide-react';
import { downloadAssets } from '@/lib/downloads';
import type { DownloadAsset } from '@/lib/downloads';

function FormatIcon({ format }: { format: DownloadAsset['format'] }) {
  if (format === 'PNG') return <FileImage size={25} aria-hidden="true" />;
  if (format === 'PDF') return <FileText size={25} aria-hidden="true" />;
  return <Package size={25} aria-hidden="true" />;
}

export default function DownloadCentre() {
  return (
    <>
      <div className="download-grid">
        {downloadAssets.map((asset) => (
          <article className="download-card" key={asset.slug}>
            <div className="download-card-top">
              <span className="download-icon">
                <FormatIcon format={asset.format} />
              </span>
              <span className="format-label">{asset.format}</span>
            </div>
            <h3>{asset.title}</h3>
            <p>{asset.description}</p>
            <div className="download-actions">
              <a href={asset.href} className="text-link" download>
                Download <Download size={16} aria-hidden="true" />
              </a>
              {asset.preview && (
                <a href={asset.preview} target="_blank" rel="noreferrer" className="preview-link">
                  Open PDF <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="download-note">
        Print files are flattened raster artwork at their stated trim sizes. Confirm bleed, colour and
        finishing requirements with your print provider.
      </p>
    </>
  );
}
