/**
 * The client half of the API contract in docs/00-overview-and-api-contract.
 *
 * These are hand-written to match the backend's Zod schemas and Mongoose models
 * rather than shared through a package: two repos, ~50 lines of types, and a
 * published package would need versioning and a release step for a one-day
 * project. If asked why there is no shared types package, that is the answer.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** The raw envelope the API returns. Callers see the narrower ApiResult below. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

/** A successful response, unwrapped: what lib/api.ts hands back. */
export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];

/** The two fields the API populates onto a patient's doctor. */
export interface DoctorRef {
  _id: string;
  name: string;
  specialization: string;
}

interface PatientFields {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  condition: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * `doctor` is populated on the /patients routes (the table renders a doctor
 * column) but left as a raw id on /doctors/:id/patients, where the doctor is
 * already the page you are on. Two types instead of `string | DoctorRef`
 * everywhere: the call site always knows which endpoint it used, so it should
 * not have to narrow.
 */
export interface Patient extends PatientFields {
  doctor: DoctorRef;
}

export interface DoctorPatient extends PatientFields {
  doctor: string;
}

export interface DoctorFilterOptions {
  specializations: string[];
  hospitals: string[];
}

export interface PatientFilterOptions {
  conditions: string[];
}

export interface PatientsPerDoctor {
  doctorId: string;
  doctorName: string;
  count: number;
}

export interface RegistrationsByDate {
  /** YYYY-MM-DD, UTC, gap-filled by the API. */
  date: string;
  doctors: number;
  patients: number;
}

export interface PatientsByCondition {
  condition: string;
  count: number;
}

export interface AnalyticsSummary {
  totalDoctors: number;
  totalPatients: number;
  patientsPerDoctor: PatientsPerDoctor[];
  registrationsByDate: RegistrationsByDate[];
  patientsByCondition: PatientsByCondition[];
}

/** Payloads for the write routes — mirrors of the backend Zod schemas. */
export interface DoctorInput {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

export interface PatientInput {
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  condition: string;
}

/** PUT /patients/:id may also reassign the patient to another doctor. */
export interface PatientUpdateInput extends Partial<PatientInput> {
  doctor?: string;
}
