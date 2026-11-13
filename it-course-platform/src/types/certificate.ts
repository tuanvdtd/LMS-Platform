// Khớp CertificatesService của BE.
export type CertificateSummary = {
  serialNo: string;
  course: { title: string; slug: string };
  issuedAt: string;
  revoked: boolean;
};

export type CertificateInfo = {
  serialNo: string;
  learnerName: string;
  courseTitle: string;
  courseSlug: string;
  instructorName: string;
  skills: string[];
  issuedAt: string;
  revoked: boolean;
  revokeReason: string | null;
};
