'use client';

import { apiFetch } from './client';
import {
  EventApplicantsResponse,
  JobApplication,
  JobPosting,
  InternshipApplication,
  InternshipPosting,
  HackathonRegistration,
  HackathonPosting,
  CreateJobPostingDto,
  CreateInternshipPostingDto,
  CreateHackathonPostingDto,
} from '@/types';

export const getPostingsForUser = async (): Promise<{ 
  jobs: JobPosting[], 
  internships: InternshipPosting[], 
  hackathons: HackathonPosting[] 
}> => {
  return apiFetch('/events');
};

// Job Postings
export const createJobPosting = async (data: CreateJobPostingDto): Promise<JobPosting> => {
  return apiFetch<JobPosting>('/events/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getJobPostingWithStatus = async (jobId: number): Promise<JobPosting & { applicationStatus: string | null }> => {
  return apiFetch(`/events/jobs/${jobId}`);
};

export const applyForJob = async (jobId: number): Promise<JobApplication> => {
  return apiFetch<JobApplication>(`/events/jobs/${jobId}/apply`, {
    method: 'POST',
  });
};

export const getJobApplicants = async (jobId: number): Promise<EventApplicantsResponse> => {
  return apiFetch<EventApplicantsResponse>(`/events/jobs/${jobId}/applicants`);
};

// Internship Postings
export const createInternshipPosting = async (data: CreateInternshipPostingDto): Promise<InternshipPosting> => {
  return apiFetch<InternshipPosting>('/events/internships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getInternshipPostingWithStatus = async (internshipId: number): Promise<InternshipPosting & { applicationStatus: string | null }> => {
  return apiFetch(`/events/internships/${internshipId}`);
};

export const applyForInternship = async (internshipId: number): Promise<InternshipApplication> => {
  return apiFetch<InternshipApplication>(`/events/internships/${internshipId}/apply`, {
    method: 'POST',
  });
};

export const getInternshipApplicants = async (internshipId: number): Promise<EventApplicantsResponse> => {
  return apiFetch<EventApplicantsResponse>(`/events/internships/${internshipId}/applicants`);
};

// Hackathon Postings
export const createHackathonPosting = async (data: CreateHackathonPostingDto): Promise<HackathonPosting> => {
  return apiFetch<HackathonPosting>('/events/hackathons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getHackathonPostingWithStatus = async (hackathonId: number): Promise<HackathonPosting & { registrationStatus: string | null }> => {
  return apiFetch(`/events/hackathons/${hackathonId}`);
};

export const registerForHackathon = async (hackathonId: number): Promise<HackathonRegistration> => {
  return apiFetch<HackathonRegistration>(`/events/hackathons/${hackathonId}/register`, {
    method: 'POST',
  });
};

export const getHackathonRegistrants = async (hackathonId: number): Promise<EventApplicantsResponse> => {
  return apiFetch<EventApplicantsResponse>(`/events/hackathons/${hackathonId}/registrants`);
};