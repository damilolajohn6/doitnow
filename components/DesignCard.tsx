import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Design } from '@/lib/designs';

export default function DesignCard({ design, priority = false }: { design: Design; priority?: boolean }) {
  return (
    <article className="design-card">
      <Link href={`/designs/${design.slug}`} className="design-card-link" aria-label={`View ${design.title}`}>
        <div className="design-card-image">
          <Image
            src={design.image}
            alt={design.alt}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            priority={priority}
          />
          <span className="image-action">
            <ArrowUpRight size={20} aria-hidden="true" />
          </span>
        </div>
        <div className="design-card-body">
          <span className="design-category">{design.category}</span>
          <h3>{design.title}</h3>
          <p>{design.summary}</p>
          <span className="text-link">
            View design <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
