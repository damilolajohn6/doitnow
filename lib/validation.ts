import { z } from 'zod';
import { getDesign } from './designs';

export const projectTypes = [
  'Wardrobes',
  'Kitchen',
  'Bedroom TV Wall',
  'Bedroom Furniture',
  'Living & Dining',
  'TV Feature Wall',
  'Bathroom',
  'Staircase',
  'Office & Storage',
  'Multiple Spaces',
  'Other',
] as const;

const phonePattern = /^[+0-9][0-9\s()-]{6,29}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const enquirySchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your name.').max(100),
    phone: z
      .string()
      .trim()
      .max(30)
      .default('')
      .refine((value) => !value || phonePattern.test(value), 'Enter a valid phone number.'),
    email: z
      .string()
      .trim()
      .max(160)
      .default('')
      .refine((value) => !value || emailPattern.test(value), 'Enter a valid email address.'),
    location: z.string().trim().max(160).default(''),
    projectType: z.enum(projectTypes, 'Select a project type.'),
    design: z
      .string()
      .trim()
      .max(120)
      .default('')
      .refine((value) => !value || Boolean(getDesign(value)), 'Select a valid design.'),
    preferredContact: z.enum(['Phone', 'Email']).default('Phone'),
    message: z
      .string()
      .trim()
      .min(10, 'Tell us a little more about your space (at least 10 characters).')
      .max(2000),
    companyWebsite: z.string().max(200).default(''),
  })
  .superRefine((data, context) => {
    if (!data.phone && !data.email) {
      context.addIssue({
        code: 'custom',
        path: ['contact'],
        message: 'Provide a phone number or email address.',
      });
    }
  });

export type EnquiryFormInput = z.infer<typeof enquirySchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] || 'form');
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}
