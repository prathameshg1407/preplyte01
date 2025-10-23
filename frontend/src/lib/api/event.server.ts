// src/lib/api/event.server.ts
import { fetchWithAuthServer } from './server';
import {
  EventApplicantsResponse,
  JobPosting,
  InternshipPosting,
  HackathonPosting,
} from '@/types';

export const getPostingsForUser = (): Promise<{ 
  jobs: JobPosting[], 
  internships: InternshipPosting[], 
  hackathons: HackathonPosting[] 
}> => {
  return fetchWithAuthServer('/events');
};

export const getJobPostingWithStatus = (jobId: number): Promise<JobPosting & { applicationStatus: string | null }> => {
  return fetchWithAuthServer(`/events/jobs/${jobId}`);
};

export const getJobApplicants = (jobId: number): Promise<EventApplicantsResponse> => {
  return fetchWithAuthServer<EventApplicantsResponse>(`/events/jobs/${jobId}/applicants`);
};

export const getInternshipPostingWithStatus = (internshipId: number): Promise<InternshipPosting & { applicationStatus: string | null }> => {
  return fetchWithAuthServer(`/events/internships/${internshipId}`);
};

export const getInternshipApplicants = (internshipId: number): Promise<EventApplicantsResponse> => {
  return fetchWithAuthServer<EventApplicantsResponse>(`/events/internships/${internshipId}/applicants`);
};

export const getHackathonPostingWithStatus = (hackathonId: number): Promise<HackathonPosting & { registrationStatus: string | null }> => {
  return fetchWithAuthServer(`/events/hackathons/${hackathonId}`);
};

export const getHackathonRegistrants = (hackathonId: number): Promise<EventApplicantsResponse> => {
  return fetchWithAuthServer<EventApplicantsResponse>(`/events/hackathons/${hackathonId}/registrants`);
};