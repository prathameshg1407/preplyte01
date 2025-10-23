export const qk = {
  drives: {
    list: (filters?: any) => ['md', 'list', filters ?? {}] as const,
    details: (id: string) => ['md', 'details', id] as const,
    rankings: (id: string) => ['md', 'rankings', id] as const,
    myResults: () => ['md', 'myResults'] as const,
    myHistory: () => ['md', 'myHistory'] as const,
  },
  attempt: {
    status: (attemptId: string) => ['md', 'attempt', 'status', attemptId] as const,
    progress: (attemptId: string) => ['md', 'attempt', 'progress', attemptId] as const,
  },
  aptitude: {
    status: (attemptId: string) => ['md', 'aptitude', 'status', attemptId] as const,
  },
  machine: {
    status: (attemptId: string) => ['md', 'machine', 'status', attemptId] as const,
  },
  admin: {
    list: (filters?: any) => ['md', 'admin', 'list', filters ?? {}] as const,
    details: (id: string) => ['md', 'admin', 'details', id] as const,
    registrations: (id: string) => ['md', 'admin', 'registrations', id] as const,
    unassigned: (id: string) => ['md', 'admin', 'unassigned', id] as const,
    batches: (id: string) => ['md', 'admin', 'batches', id] as const,
    analytics: (id: string) => ['md', 'admin', 'analytics', id] as const,
    results: (id: string) => ['md', 'admin', 'results', id] as const,
  },
};