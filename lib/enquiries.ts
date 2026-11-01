export const enquiryStatuses = ['new', 'contacted', 'closed'] as const;
export type EnquiryStatus = (typeof enquiryStatuses)[number];

export interface EnquiryInput {
  id: string;
  reference: string;
  createdAt: string;
  status: EnquiryStatus;
  name: string;
  phone: string;
  email: string;
  location: string;
  projectType: string;
  design: string;
  preferredContact: 'Phone' | 'Email';
  message: string;
}

export interface EnquiryRecord extends EnquiryInput {}

function hasPostgresConnection() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

async function getStore() {
  if (hasPostgresConnection()) return import('./enquiries-postgres');
  if (process.env.VERCEL === '1') {
    throw new Error('DATABASE_URL is required for persistent enquiries on Vercel.');
  }
  return import('./enquiries-sqlite');
}

export async function saveEnquiry(entry: EnquiryInput): Promise<EnquiryRecord> {
  return (await getStore()).saveEnquiry(entry);
}

export async function listEnquiries(limit = 250): Promise<EnquiryRecord[]> {
  return (await getStore()).listEnquiries(limit);
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<EnquiryRecord | null> {
  return (await getStore()).updateEnquiryStatus(id, status);
}

export async function checkEnquiryStore(): Promise<void> {
  await (await getStore()).checkEnquiryStore();
}
