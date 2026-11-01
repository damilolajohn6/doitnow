interface StructuredDataProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return <script type="application/ld+json">{JSON.stringify(data).replace(/</g, '\\u003c')}</script>;
}
