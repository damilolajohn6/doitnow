export const projectStages = [
  'enquiry',
  'consultation',
  'measurement',
  'design',
  'production',
  'installation',
  'completed',
] as const;

export type ProjectStage = (typeof projectStages)[number];

export interface ProjectProfile {
  stage: ProjectStage;
  assignedTo: string;
  followUpAt: string;
  internalNotes: string;
  approvedAt: string;
  revisionNotes: string;
  updatedAt: string;
}
