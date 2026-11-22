import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { EnquiryInput, EnquiryRecord } from './enquiries';
import { platformQuery, platformRun } from './platform-store';

export interface StudioBrief {
  rooms: string[];
  dimensions: string;
  budget: string;
  timeline: string;
  styles: string[];
  favourites: string[];
  configuration: Record<string, unknown>;
}

export const emptyStudioBrief: StudioBrief = {
  rooms: [],
  dimensions: '',
  budget: '',
  timeline: '',
  styles: [],
  favourites: [],
  configuration: {},
};

interface BriefRow {
  id: string;
  enquiry_id: string;
  rooms: string;
  dimensions: string;
  budget: string;
  timeline: string;
  styles: string;
  favourites: string;
  configuration: string;
  created_at: string;
}

function parseArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapBrief(row?: BriefRow): StudioBrief {
  if (!row) return emptyStudioBrief;
  try {
    return {
      rooms: parseArray(row.rooms),
      dimensions: row.dimensions,
      budget: row.budget,
      timeline: row.timeline,
      styles: parseArray(row.styles),
      favourites: parseArray(row.favourites),
      configuration: JSON.parse(row.configuration) as Record<string, unknown>,
    };
  } catch {
    return emptyStudioBrief;
  }
}

export async function saveProjectBrief(enquiryId: string, brief: StudioBrief) {
  await platformRun(
    `INSERT INTO project_briefs (id, enquiry_id, rooms, dimensions, budget, timeline, styles,
      favourites, configuration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      enquiryId,
      JSON.stringify(brief.rooms),
      brief.dimensions,
      brief.budget,
      brief.timeline,
      JSON.stringify(brief.styles),
      JSON.stringify(brief.favourites),
      JSON.stringify(brief.configuration),
      new Date().toISOString(),
    ],
  );
}

export async function getProjectBrief(enquiryId: string) {
  const rows = await platformQuery<BriefRow>('SELECT * FROM project_briefs WHERE enquiry_id = ? LIMIT 1', [
    enquiryId,
  ]);
  return mapBrief(rows[0]);
}

interface EnquiryRow {
  id: string;
  reference: string;
  created_at: string;
  status: EnquiryRecord['status'];
  name: string;
  phone: string;
  email: string;
  location: string;
  project_type: string;
  design: string;
  preferred_contact: 'Phone' | 'Email';
  message: string;
}

function mapEnquiry(row: EnquiryRow): EnquiryRecord {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    name: row.name,
    phone: row.phone,
    email: row.email,
    location: row.location,
    projectType: row.project_type,
    design: row.design,
    preferredContact: row.preferred_contact,
    message: row.message,
  };
}

export async function getBriefByReference(reference: string) {
  const rows = await platformQuery<EnquiryRow>('SELECT * FROM enquiries WHERE reference = ? LIMIT 1', [
    reference,
  ]);
  if (!rows[0]) return null;
  const enquiry = mapEnquiry(rows[0]);
  return { enquiry, brief: await getProjectBrief(enquiry.id) };
}

function signature(reference: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not configured.');
  return createHmac('sha256', secret).update(`project-brief:${reference}`).digest('base64url');
}

export function projectBriefUrl(reference: string) {
  return `/api/project-briefs/${encodeURIComponent(reference)}/pdf?token=${signature(reference)}`;
}

export function validProjectBriefToken(reference: string, token: string) {
  const expected = Buffer.from(signature(reference));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export async function generateProjectBriefPdf(
  enquiry: EnquiryInput,
  brief: StudioBrief,
  files: string[] = [],
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Do It Now project brief ${enquiry.reference}`);
  pdf.setAuthor('Do It Now Furniture and Interior');
  pdf.setSubject('Customer project brief');
  pdf.setCreationDate(new Date(enquiry.createdAt));
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const charcoal = rgb(0.145, 0.161, 0.153);
  const walnut = rgb(0.604, 0.42, 0.247);
  const muted = rgb(0.39, 0.404, 0.384);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 790;

  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    y = 790;
  }
  function text(value: string, size = 10, font = regular, color = charcoal, indent = 0) {
    const safeValue = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/×/g, 'x')
      .replace(/·/g, '|')
      .replace(/[^\x20-\x7E]+/g, '?');
    const maxWidth = 495 - indent;
    const words = safeValue.split(/\s+/);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        if (y < 60) newPage();
        page.drawText(line, { x: 50 + indent, y, size, font, color });
        y -= size * 1.5;
        line = word;
      } else line = candidate;
    }
    if (line) {
      if (y < 60) newPage();
      page.drawText(line, { x: 50 + indent, y, size, font, color });
      y -= size * 1.5;
    }
  }
  function heading(value: string) {
    if (y < 100) newPage();
    y -= 10;
    text(value.toUpperCase(), 10, bold, walnut);
    y -= 2;
  }
  function field(label: string, value: string) {
    if (!value) return;
    text(`${label}: ${value}`, 10, regular, charcoal);
  }

  page.drawRectangle({ x: 0, y: 812, width: 595.28, height: 30, color: walnut });
  text('DO IT NOW FURNITURE AND INTERIOR', 15, bold, charcoal);
  text('Design. Build. Deliver.', 9, regular, muted);
  y -= 14;
  text('PROJECT BRIEF', 22, bold, walnut);
  field('Reference', enquiry.reference);
  field('Prepared', new Date(enquiry.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }));

  heading('Customer');
  field('Name', enquiry.name);
  field('Phone', enquiry.phone || 'Not provided');
  field('Email', enquiry.email || 'Not provided');
  field('Location', enquiry.location || 'Not provided');
  field('Preferred contact', enquiry.preferredContact);

  heading('Project');
  field('Project type', enquiry.projectType);
  field('Spaces', brief.rooms.join(', '));
  field('Dimensions and room notes', brief.dimensions);
  field('Indicative budget range', brief.budget);
  field('Desired timeline', brief.timeline);
  field('Style direction', brief.styles.join(', '));
  field('Preferred catalogue design', enquiry.design.replace(/-/g, ' '));
  field('Shortlisted designs', brief.favourites.map((item) => item.replace(/-/g, ' ')).join(', '));

  const configuration = Object.entries(brief.configuration).filter(([, value]) => String(value).trim());
  if (configuration.length) {
    heading('3D configuration');
    for (const [key, value] of configuration) field(key.replace(/([A-Z])/g, ' $1'), String(value));
  }

  if (files.length) {
    heading('Uploaded references');
    for (const file of files) text(`- ${file}`, 10, regular, charcoal);
  }

  heading('Customer notes');
  text(enquiry.message, 10, regular, charcoal);
  heading('Next step');
  text(
    'Do It Now will review this brief, confirm actual site dimensions and discuss the appropriate design, material and production scope. This document is a project brief, not a final construction drawing or quotation.',
    10,
    regular,
    muted,
  );
  text('Contact: +234 701 717 6611 · gabdidi52@gmail.com', 9, bold, charcoal);

  const pages = pdf.getPages();
  pages.forEach((item: PDFPage, index: number) => {
    item.drawText(`${enquiry.reference}  ·  Page ${index + 1} of ${pages.length}`, {
      x: 50,
      y: 28,
      size: 8,
      font: regular,
      color: muted,
    });
  });
  return pdf.save();
}
