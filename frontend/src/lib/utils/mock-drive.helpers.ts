import type {
  MockDrive,
  MockDriveStatus,
  MockDriveRegistrationStatus,
  MockDriveAttemptStatus,
  QuestionDifficulty,
 
  ComponentStatus,
  EligibilityCriteria,
  MockDriveBatch,
  MockDriveListItem,
  AptitudeTestConfig,
  MachineTestConfig,
  AiInterviewConfig,
  MockDriveAttempt,
  AttemptProgressResponse,
  MockDriveProgress,
} from '@/types/mock-drive.types';
import { TestComponent } from '@/types/mock-drive.types';

// ============================================================================
// STATUS & BADGE HELPERS
// ============================================================================

/**
 * Get status badge color
 */
export function getStatusColor(status: MockDriveStatus): string {
  const colors: Record<MockDriveStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    REGISTRATION_OPEN: 'bg-green-100 text-green-800',
    REGISTRATION_CLOSED: 'bg-yellow-100 text-yellow-800',
    ONGOING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get registration status badge color
 */
export function getRegistrationStatusColor(status: MockDriveRegistrationStatus): string {
  const colors: Record<MockDriveRegistrationStatus, string> = {
    REGISTERED: 'bg-blue-100 text-blue-800',
    BATCH_ASSIGNED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    DISQUALIFIED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get attempt status badge color
 */
export function getAttemptStatusColor(status: MockDriveAttemptStatus): string {
  const colors: Record<MockDriveAttemptStatus, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ABANDONED: 'bg-orange-100 text-orange-800',
    DISQUALIFIED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get difficulty badge color
 */
export function getDifficultyColor(difficulty: QuestionDifficulty): string {
  const colors: Record<QuestionDifficulty, string> = {
    EASY: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HARD: 'bg-red-100 text-red-800',
  };
  return colors[difficulty] || 'bg-gray-100 text-gray-800';
}

/**
 * NEW: Get test component badge color
 */
export function getComponentColor(component: TestComponent): string {
  const colors: Record<TestComponent, string> = {
    APTITUDE: 'bg-purple-100 text-purple-800',
    MACHINE_TEST: 'bg-blue-100 text-blue-800',
    AI_INTERVIEW: 'bg-indigo-100 text-indigo-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return colors[component] || 'bg-gray-100 text-gray-800';
}

// ============================================================================
// TEST COMPONENT HELPERS (NEW)
// ============================================================================

/**
 * Get component display name
 */
export function getComponentDisplayName(component: TestComponent): string {
  const names: Record<TestComponent, string> = {
    APTITUDE: 'Aptitude Test',
    MACHINE_TEST: 'Coding Test',
    AI_INTERVIEW: 'AI Interview',
    COMPLETED: 'Completed',
  };
  return names[component];
}

/**
 * Get component short name
 */
export function getComponentShortName(component: TestComponent): string {
  const names: Record<TestComponent, string> = {
    APTITUDE: 'Aptitude',
    MACHINE_TEST: 'Coding',
    AI_INTERVIEW: 'Interview',
    COMPLETED: 'Done',
  };
  return names[component];
}

/**
 * Get component icon (using emoji or icon names)
 */
export function getComponentIcon(component: TestComponent): string {
  const icons: Record<TestComponent, string> = {
    APTITUDE: '📝',
    MACHINE_TEST: '💻',
    AI_INTERVIEW: '🎤',
    COMPLETED: '✅',
  };
  return icons[component];
}

/**
 * Get component order/index
 */
export function getComponentOrder(component: TestComponent): number {
  const order: Record<TestComponent, number> = {
    APTITUDE: 1,
    MACHINE_TEST: 2,
    AI_INTERVIEW: 3,
    COMPLETED: 4,
  };
  return order[component];
}

/**
 * Check if component is completed
 */
export function isComponentCompleted(
  component: TestComponent,
  progress: MockDriveProgress
): boolean {
  switch (component) {
    case TestComponent.APTITUDE:
      return progress.components.aptitude?.completed ?? false;
    case TestComponent.MACHINE_TEST:
      return progress.components.machineTest?.completed ?? false;
    case TestComponent.AI_INTERVIEW:
      return progress.components.aiInterview?.completed ?? false;
    case TestComponent.COMPLETED:
      return true;
    default:
      return false;
  }
}

/**
 * Get progress percentage for a component
 */
export function getComponentProgress(
  component: TestComponent,
  progress: AttemptProgressResponse
): number {
  switch (component) {
    case TestComponent.APTITUDE:
      return progress.progress.aptitude.completed ? 100 : 0;
    case TestComponent.MACHINE_TEST:
      if (!progress.progress.machineTest.required) return 0;
      const total = progress.progress.machineTest.problemsCount;
      const attempted = progress.progress.machineTest.submissionsCount;
      return total > 0 ? Math.round((attempted / total) * 100) : 0;
    case TestComponent.AI_INTERVIEW:
      if (!progress.progress.aiInterview.required) return 0;
      const totalQ = progress.progress.aiInterview.totalQuestions;
      const answered = progress.progress.aiInterview.questionsAnswered;
      return totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
    case TestComponent.COMPLETED:
      return 100;
    default:
      return 0;
  }
}

/**
 * Calculate overall progress percentage
 */
export function calculateOverallProgress(progress: MockDriveProgress): number {
  let completed = 0;
  let total = 0;

  if (progress.components.aptitude) {
    total++;
    if (progress.components.aptitude.completed) completed++;
  }
  if (progress.components.machineTest) {
    total++;
    if (progress.components.machineTest.completed) completed++;
  }
  if (progress.components.aiInterview) {
    total++;
    if (progress.components.aiInterview.completed) completed++;
  }

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/**
 * Get next component to attempt
 */
export function getNextComponent(progress: MockDriveProgress): TestComponent | null {
  return progress.nextComponent;
}

/**
 * Check if can proceed to next component
 */
export function canProceedToNext(componentStatus: ComponentStatus): boolean {
  return componentStatus.canProceed;
}

/**
 * Get component status message
 */
export function getComponentStatusMessage(componentStatus: ComponentStatus): string {
  return componentStatus.message;
}

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format date range
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

/**
 * Format date and time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get time remaining
 */
export function getTimeRemaining(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = new Date(targetDate).getTime() - new Date().getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(targetDate: string): string {
  const { days, hours, minutes, total } = getTimeRemaining(targetDate);

  if (total <= 0) {
    return 'Ended';
  }

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}

/**
 * Format time ago (e.g., "2 hours ago")
 */
export function formatTimeAgo(dateString: string): string {
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diffMs = now - past;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// ============================================================================
// MOCK DRIVE STATUS CHECKS
// ============================================================================

/**
 * Check if mock drive is active
 */
export function isMockDriveActive(drive: MockDrive): boolean {
  const now = new Date();
  const driveStart = new Date(drive.driveStartDate);
  const driveEnd = new Date(drive.driveEndDate);

  return now >= driveStart && now <= driveEnd;
}

/**
 * Check if registration is open
 */
export function isRegistrationOpen(drive: MockDrive | MockDriveListItem): boolean {
  const now = new Date();
  const regStart = new Date(drive.registrationStartDate);
  const regEnd = new Date(drive.registrationEndDate);

  return now >= regStart && now <= regEnd && drive.isPublished;
}

/**
 * Get mock drive phase
 */
export function getMockDrivePhase(drive: MockDrive | MockDriveListItem): {
  phase: 'before_registration' | 'registration' | 'before_drive' | 'drive' | 'completed';
  message: string;
  canRegister: boolean;
  canAttempt: boolean;
} {
  const now = new Date();
  const regStart = new Date(drive.registrationStartDate);
  const regEnd = new Date(drive.registrationEndDate);
  const driveStart = new Date(drive.driveStartDate);
  const driveEnd = new Date(drive.driveEndDate);

  if (now < regStart) {
    return {
      phase: 'before_registration',
      message: `Registration opens ${formatTimeRemaining(drive.registrationStartDate)}`,
      canRegister: false,
      canAttempt: false,
    };
  }

  if (now >= regStart && now <= regEnd) {
    return {
      phase: 'registration',
      message: `Registration closes ${formatTimeRemaining(drive.registrationEndDate)}`,
      canRegister: drive.isPublished,
      canAttempt: false,
    };
  }

  if (now > regEnd && now < driveStart) {
    return {
      phase: 'before_drive',
      message: `Drive starts ${formatTimeRemaining(drive.driveStartDate)}`,
      canRegister: false,
      canAttempt: false,
    };
  }

  if (now >= driveStart && now <= driveEnd) {
    return {
      phase: 'drive',
      message: `Drive ends ${formatTimeRemaining(drive.driveEndDate)}`,
      canRegister: false,
      canAttempt: true,
    };
  }

  return {
    phase: 'completed',
    message: 'Mock drive has ended',
    canRegister: false,
    canAttempt: false,
  };
}

// ============================================================================
// ELIGIBILITY CHECKS
// ============================================================================

/**
 * Validate eligibility criteria
 */
export function checkEligibility(
  criteria: EligibilityCriteria,
  userProfile: {
    averageCgpa?: number;
    sscPercentage?: number;
    hscPercentage?: number;
    skills?: Array<{ name: string } | { tag: { name: string } }>;
  }
): {
  eligible: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (criteria.minCgpa && (!userProfile.averageCgpa || userProfile.averageCgpa < criteria.minCgpa)) {
    reasons.push(`Minimum CGPA required: ${criteria.minCgpa}`);
  }

  if (
    criteria.minSscPercentage &&
    (!userProfile.sscPercentage || Number(userProfile.sscPercentage) < criteria.minSscPercentage)
  ) {
    reasons.push(`Minimum SSC percentage required: ${criteria.minSscPercentage}%`);
  }

  if (
    criteria.minHscPercentage &&
    (!userProfile.hscPercentage || Number(userProfile.hscPercentage) < criteria.minHscPercentage)
  ) {
    reasons.push(`Minimum HSC percentage required: ${criteria.minHscPercentage}%`);
  }

  if (criteria.requiredSkills && criteria.requiredSkills.length > 0) {
    const userSkills =
      userProfile.skills?.map((s) => {
        return 'name' in s ? s.name.toLowerCase() : s.tag.name.toLowerCase();
      }) || [];

    const missingSkills = criteria.requiredSkills.filter(
      (skill) => !userSkills.includes(skill.toLowerCase())
    );

    if (missingSkills.length > 0) {
      reasons.push(`Required skills missing: ${missingSkills.join(', ')}`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Check if student meets eligibility criteria
 */
export function checkStudentEligibility(
  mockDrive: MockDrive,
  studentProfile: {
    graduationYear?: number;
    averageCgpa?: number;
    sscPercentage?: number;
    hscPercentage?: number;
    skills?: Array<{ name: string } | { tag: { name: string } }>;
  }
): {
  eligible: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check graduation year
  if (studentProfile.graduationYear) {
    const currentYear = new Date().getFullYear();
    const studentYear = studentProfile.graduationYear - currentYear;

    if (studentYear > 0 && studentYear <= 4) {
      if (!mockDrive.eligibleYear.includes(studentYear)) {
        reasons.push(
          `This mock drive is only for Year ${mockDrive.eligibleYear.join(', ')} students`
        );
      }
    }
  }

  // Check eligibility criteria
  if (mockDrive.eligibilityCriteria && typeof mockDrive.eligibilityCriteria === 'object') {
    const criteria = mockDrive.eligibilityCriteria as EligibilityCriteria;
    const criteriaCheck = checkEligibility(criteria, studentProfile);
    reasons.push(...criteriaCheck.reasons);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

// ============================================================================
// PROGRESS & COMPLETION HELPERS
// ============================================================================

/**
 * Calculate progress percentage
 */
export function calculateProgress(
  completedComponents: number,
  totalComponents: number
): number {
  if (totalComponents === 0) return 0;
  return Math.round((completedComponents / totalComponents) * 100);
}

/**
 * Get component name (legacy - use getComponentDisplayName for new code)
 */
export function getComponentName(
  component: 'aptitude' | 'machineTest' | 'aiInterview'
): string {
  const names = {
    aptitude: 'Aptitude Test',
    machineTest: 'Coding Test',
    aiInterview: 'AI Interview',
  };
  return names[component];
}

/**
 * Calculate attempt progress from progress response
 */
export function calculateAttemptProgress(progress: AttemptProgressResponse): {
  completedComponents: number;
  totalComponents: number;
  percentage: number;
  currentComponent: TestComponent;
  nextComponent: TestComponent | null;
} {
  let completed = 0;
  let total = 0;

  if (progress.progress.aptitude.required) {
    total++;
    if (progress.progress.aptitude.completed) {
      completed++;
    }
  }

  if (progress.progress.machineTest.required) {
    total++;
    if (progress.progress.machineTest.completed) {
      completed++;
    }
  }

  if (progress.progress.aiInterview.required) {
    total++;
    if (progress.progress.aiInterview.completed) {
      completed++;
    }
  }

  return {
    completedComponents: completed,
    totalComponents: total,
    percentage: calculateProgress(completed, total),
    currentComponent: progress.currentComponent,
    nextComponent: progress.nextComponent,
  };
}

/**
 * Check if all components are completed
 */
export function areAllComponentsCompleted(progress: AttemptProgressResponse): boolean {
  const { completedComponents, totalComponents } = calculateAttemptProgress(progress);
  return completedComponents === totalComponents && totalComponents > 0;
}

/**
 * Get remaining components
 */
export function getRemainingComponents(progress: AttemptProgressResponse): TestComponent[] {
  const remaining: TestComponent[] = [];

  if (progress.progress.aptitude.required && !progress.progress.aptitude.completed) {
    remaining.push(TestComponent.APTITUDE);
  }
  if (progress.progress.machineTest.required && !progress.progress.machineTest.completed) {
    remaining.push(TestComponent.MACHINE_TEST);
  }
  if (progress.progress.aiInterview.required && !progress.progress.aiInterview.completed) {
    remaining.push(TestComponent.AI_INTERVIEW);
  }

  return remaining;
}

// ============================================================================
// SORTING & FILTERING
// ============================================================================

/**
 * Sort mock drives
 */
export function sortMockDrives<T extends { driveStartDate: string; createdAt: string }>(
  drives: T[],
  sortBy: 'driveStartDate' | 'createdAt' = 'driveStartDate',
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...drives].sort((a, b) => {
    const dateA = new Date(a[sortBy]).getTime();
    const dateB = new Date(b[sortBy]).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Filter mock drives by status
 */
export function filterMockDrivesByStatus<T extends { status: MockDriveStatus }>(
  drives: T[],
  statuses: MockDriveStatus[]
): T[] {
  if (statuses.length === 0) return drives;
  return drives.filter((drive) => statuses.includes(drive.status));
}

/**
 * Group mock drives by status
 */
export function groupMockDrivesByStatus<T extends { status: MockDriveStatus }>(
  drives: T[]
): Record<MockDriveStatus, T[]> {
  const grouped: Partial<Record<MockDriveStatus, T[]>> = {};

  drives.forEach((drive) => {
    if (!grouped[drive.status]) {
      grouped[drive.status] = [];
    }
    grouped[drive.status]!.push(drive);
  });

  return grouped as Record<MockDriveStatus, T[]>;
}

/**
 * Filter mock drives by eligibility
 */
export function filterEligibleMockDrives(
  drives: MockDrive[],
  studentProfile: {
    graduationYear?: number;
    averageCgpa?: number;
    sscPercentage?: number;
    hscPercentage?: number;
    skills?: Array<{ name: string }>;
  }
): MockDrive[] {
  return drives.filter((drive) => {
    const { eligible } = checkStudentEligibility(drive, studentProfile);
    return eligible;
  });
}

// ============================================================================
// TOPIC & QUALITY METRICS HELPERS (NEW)
// ============================================================================

/**
 * Group items by topic
 */
export function groupByTopic<T extends { topic: string }>(items: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  items.forEach((item) => {
    if (!grouped[item.topic]) {
      grouped[item.topic] = [];
    }
    grouped[item.topic].push(item);
  });

  return grouped;
}

/**
 * Get quality indicator color
 */
export function getQualityColor(successRate: number): string {
  if (successRate >= 70) return 'text-red-600'; // Too easy
  if (successRate >= 50) return 'text-green-600'; // Good balance
  if (successRate >= 30) return 'text-blue-600'; // Challenging
  return 'text-orange-600'; // Too hard
}

/**
 * Get quality indicator label
 */
export function getQualityLabel(successRate: number): string {
  if (successRate >= 70) return 'Too Easy';
  if (successRate >= 50) return 'Well Balanced';
  if (successRate >= 30) return 'Challenging';
  return 'Very Hard';
}

/**
 * Calculate success rate percentage
 */
export function calculateSuccessRate(correctCount: number, totalAttempts: number): number {
  if (totalAttempts === 0) return 0;
  return Math.round((correctCount / totalAttempts) * 100 * 100) / 100;
}

/**
 * Format success rate display
 */
export function formatSuccessRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

// ============================================================================
// BATCH MANAGEMENT HELPERS
// ============================================================================

/**
 * Check if student can attempt based on batch time
 */
export function canAttemptBasedOnBatch(batch: MockDriveBatch | null): {
  canAttempt: boolean;
  message?: string;
} {
  if (!batch) {
    return {
      canAttempt: false,
      message: 'You have not been assigned to a batch yet',
    };
  }

  if (!batch.isActive) {
    return {
      canAttempt: false,
      message: 'Your batch is currently inactive',
    };
  }

  const now = new Date();
  const batchStart = new Date(batch.startTime);
  const batchEnd = new Date(batch.endTime);

  if (now < batchStart) {
    return {
      canAttempt: false,
      message: `Your batch starts at ${batchStart.toLocaleString()}`,
    };
  }

  if (now > batchEnd) {
    return {
      canAttempt: false,
      message: 'Your batch time has ended',
    };
  }

  return {
    canAttempt: true,
  };
}

/**
 * Get time until batch starts (in milliseconds)
 */
export function getTimeUntilBatchStarts(batch: MockDriveBatch): number {
  const now = new Date();
  const batchStart = new Date(batch.startTime);
  return Math.max(0, batchStart.getTime() - now.getTime());
}

/**
 * Get remaining batch time (in milliseconds)
 */
export function getRemainingBatchTime(batch: MockDriveBatch): number {
  const now = new Date();
  const batchEnd = new Date(batch.endTime);
  return Math.max(0, batchEnd.getTime() - now.getTime());
}

/**
 * Format batch time slot
 */
export function formatBatchTimeSlot(batch: MockDriveBatch): string {
  const startTime = new Date(batch.startTime);
  const endTime = new Date(batch.endTime);

  const dateStr = startTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const startTimeStr = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTimeStr = endTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
}

/**
 * Calculate batch capacity percentage
 */
export function getBatchCapacityPercentage(batch: MockDriveBatch): number {
  if (!batch.maxStudents) return 0;
  const currentCount = batch._count?.students || 0;
  return Math.round((currentCount / batch.maxStudents) * 100);
}

/**
 * Get available slots in batch
 */
export function getAvailableBatchSlots(batch: MockDriveBatch): number {
  if (!batch.maxStudents) return Infinity;
  const currentCount = batch._count?.students || 0;
  return Math.max(0, batch.maxStudents - currentCount);
}

/**
 * Check if batch is full
 */
export function isBatchFull(batch: MockDriveBatch): boolean {
  const available = getAvailableBatchSlots(batch);
  return available === 0;
}

/**
 * Get batch status
 */
export function getBatchStatus(batch: MockDriveBatch): {
  status: 'upcoming' | 'active' | 'ended';
  message: string;
} {
  const now = new Date();
  const startTime = new Date(batch.startTime);
  const endTime = new Date(batch.endTime);

  if (now < startTime) {
    return {
      status: 'upcoming',
      message: `Starts ${formatTimeRemaining(batch.startTime)}`,
    };
  }

  if (now >= startTime && now <= endTime) {
    return {
      status: 'active',
      message: `Ends ${formatTimeRemaining(batch.endTime)}`,
    };
  }

  return {
    status: 'ended',
    message: 'Ended',
  };
}

/**
 * Format remaining time for batch
 */
export function formatBatchTimeRemaining(batch: MockDriveBatch): {
  untilStart?: string;
  untilEnd?: string;
  status: 'upcoming' | 'active' | 'ended';
} {
  const now = new Date();
  const startTime = new Date(batch.startTime);
  const endTime = new Date(batch.endTime);

  if (now < startTime) {
    return {
      untilStart: formatTimeRemaining(batch.startTime),
      status: 'upcoming',
    };
  }

  if (now >= startTime && now <= endTime) {
    return {
      untilEnd: formatTimeRemaining(batch.endTime),
      status: 'active',
    };
  }

  return {
    status: 'ended',
  };
}

/**
 * Validate batch assignment capacity
 */
export function validateBatchCapacity(
  batch: MockDriveBatch,
  studentsToAssign: number
): {
  canAssign: boolean;
  reason?: string;
} {
  if (!batch.maxStudents) {
    return { canAssign: true };
  }

  const currentCount = batch._count?.students || 0;
  const availableSlots = batch.maxStudents - currentCount;

  if (studentsToAssign > availableSlots) {
    return {
      canAssign: false,
      reason: `Batch only has ${availableSlots} available slot(s), but you're trying to assign ${studentsToAssign} student(s)`,
    };
  }

  return { canAssign: true };
}

// ============================================================================
// SCORE & GRADE HELPERS
// ============================================================================

/**
 * Get score color based on percentage
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-blue-600';
  if (percentage >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get score background color
 */
export function getScoreBgColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-100';
  if (percentage >= 60) return 'bg-blue-100';
  if (percentage >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}

/**
 * Get grade based on percentage
 */
export function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

/**
 * Format score display
 */
export function formatScore(score: number, maxScore: number): string {
  return `${score.toFixed(1)} / ${maxScore.toFixed(0)}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100 * 100) / 100; // 2 decimal places
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if dates are valid
 */
export function validateMockDriveDates(dates: {
  registrationStartDate: string;
  registrationEndDate: string;
  driveStartDate: string;
  driveEndDate: string;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const regStart = new Date(dates.registrationStartDate);
  const regEnd = new Date(dates.registrationEndDate);
  const driveStart = new Date(dates.driveStartDate);
  const driveEnd = new Date(dates.driveEndDate);
  const now = new Date();

  // Check past dates
  if (regStart < now) {
    errors.push('Registration start date cannot be in the past');
  }

  if (regEnd <= regStart) {
    errors.push('Registration end date must be after start date');
  }

  if (driveStart <= regEnd) {
    errors.push('Drive start date must be after registration end date');
  }

  if (driveEnd <= driveStart) {
    errors.push('Drive end date must be after start date');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate batch time overlap
 */
export function checkBatchTimeOverlap(
  newBatch: { startTime: string; endTime: string },
  existingBatches: Array<{ startTime: string; endTime: string }>
): {
  hasOverlap: boolean;
  overlappingBatch?: { startTime: string; endTime: string };
} {
  const newStart = new Date(newBatch.startTime);
  const newEnd = new Date(newBatch.endTime);

  for (const batch of existingBatches) {
    const existingStart = new Date(batch.startTime);
    const existingEnd = new Date(batch.endTime);

    if (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      return {
        hasOverlap: true,
        overlappingBatch: batch,
      };
    }
  }

  return { hasOverlap: false };
}

// ============================================================================
// CONFIG HELPERS
// ============================================================================

/**
 * Get total questions count from aptitude config
 */
export function getTotalAptitudeQuestions(config: AptitudeTestConfig): number {
  if (config.questionDistribution && config.questionDistribution.length > 0) {
    return config.questionDistribution.reduce((sum, dist) => sum + dist.count, 0);
  }
  return config.totalQuestions;
}

/**
 * Get total machine test problems from config
 */
export function getTotalMachineTestProblems(config: MachineTestConfig): number {
  if (config.problemDistribution && config.problemDistribution.length > 0) {
    return config.problemDistribution.reduce((sum, dist) => sum + dist.count, 0);
  }
  if (config.selectedProblems && config.selectedProblems.length > 0) {
    return config.selectedProblems.length;
  }
  return config.totalProblems;
}

/**
 * Calculate total mock drive duration
 */
export function calculateTotalDuration(
  aptitudeConfig?: AptitudeTestConfig,
  machineTestConfig?: MachineTestConfig,
  aiInterviewConfig?: AiInterviewConfig
): number {
  let total = 0;
  if (aptitudeConfig) total += aptitudeConfig.durationMinutes;
  if (machineTestConfig) total += machineTestConfig.durationMinutes;
  if (aiInterviewConfig) total += aiInterviewConfig.durationMinutes;
  return total;
}

/**
 * Get component configurations count
 */
export function getComponentCount(
  aptitudeConfig?: AptitudeTestConfig,
  machineTestConfig?: MachineTestConfig,
  aiInterviewConfig?: AiInterviewConfig
): number {
  let count = 0;
  if (aptitudeConfig) count++;
  if (machineTestConfig) count++;
  if (aiInterviewConfig) count++;
  return count;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Get ordinal suffix for rank
 */
export function getOrdinalSuffix(rank: number): string {
  const j = rank % 10;
  const k = rank % 100;

  if (j === 1 && k !== 11) return `${rank}st`;
  if (j === 2 && k !== 12) return `${rank}nd`;
  if (j === 3 && k !== 13) return `${rank}rd`;
  return `${rank}th`;
}

/**
 * Format percentile
 */
export function formatPercentile(percentile: number): string {
  return `${percentile.toFixed(1)}th percentile`;
}

/**
 * Format array as comma-separated list
 */
export function formatList(items: string[], max: number = 3): string {
  if (items.length === 0) return 'None';
  if (items.length <= max) return items.join(', ');
  const shown = items.slice(0, max);
  const remaining = items.length - max;
  return `${shown.join(', ')} +${remaining} more`;
}

/**
 * Get progress bar color
 */
export function getProgressBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// SEQUENTIAL FLOW HELPERS (NEW)
// ============================================================================

/**
 * Get flow visualization steps
 */
export function getFlowSteps(
  hasAptitude: boolean,
  hasMachineTest: boolean,
  hasAiInterview: boolean
): Array<{ component: TestComponent; name: string; icon: string; order: number }> {
  const steps: Array<{ component: TestComponent; name: string; icon: string; order: number }> = [];

  if (hasAptitude) {
    steps.push({
      component: TestComponent.APTITUDE,
      name: 'Aptitude Test',
      icon: '📝',
      order: 1,
    });
  }

  if (hasMachineTest) {
    steps.push({
      component: TestComponent.MACHINE_TEST,
      name: 'Coding Test',
      icon: '💻',
      order: 2,
    });
  }

  if (hasAiInterview) {
    steps.push({
      component: TestComponent.AI_INTERVIEW,
      name: 'AI Interview',
      icon: '🎤',
      order: 3,
    });
  }

  steps.push({
    component: TestComponent.COMPLETED,
    name: 'Results',
    icon: '✅',
    order: 4,
  });

  return steps;
}

/**
 * Check if component is current
 */
export function isCurrentComponent(
  component: TestComponent,
  currentComponent: TestComponent
): boolean {
  return component === currentComponent;
}

/**
 * Check if component is accessible (completed or current)
 */
export function isComponentAccessible(
  component: TestComponent,
  currentComponent: TestComponent
): boolean {
  const currentOrder = getComponentOrder(currentComponent);
  const componentOrder = getComponentOrder(component);
  return componentOrder <= currentOrder;
}

/**
 * Get component route path
 */
export function getComponentRoute(
  attemptId: string,
  component: TestComponent
): string {
  const routes: Record<TestComponent, string> = {
    APTITUDE: `/mock-drives/attempt/${attemptId}/aptitude`,
    MACHINE_TEST: `/mock-drives/attempt/${attemptId}/coding`,
    AI_INTERVIEW: `/mock-drives/attempt/${attemptId}/interview`,
    COMPLETED: `/mock-drives/attempt/${attemptId}/results`,
  };
  return routes[component];
}

// ============================================================================
// ANALYTICS HELPERS (NEW)
// ============================================================================

/**
 * Calculate average from array
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Find median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Group and count by property
 */
export function groupAndCount<T, K extends keyof T>(
  items: T[],
  key: K
): Record<string, number> {
  const grouped: Record<string, number> = {};
  items.forEach((item) => {
    const value = String(item[key]);
    grouped[value] = (grouped[value] || 0) + 1;
  });
  return grouped;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = calculateAverage(values);
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  // Status & Badges
  getStatusColor,
  getRegistrationStatusColor,
  getAttemptStatusColor,
  getDifficultyColor,
  getComponentColor,

  // Test Components
  getComponentDisplayName,
  getComponentShortName,
  getComponentIcon,
  getComponentOrder,
  isComponentCompleted,
  getComponentProgress,
  calculateOverallProgress,
  getNextComponent,
  canProceedToNext,
  getComponentStatusMessage,

  // Date & Time
  formatDuration,
  formatDateRange,
  formatDateTime,
  getTimeRemaining,
  formatTimeRemaining,
  formatTimeAgo,

  // Status Checks
  isMockDriveActive,
  isRegistrationOpen,
  getMockDrivePhase,

  // Eligibility
  checkEligibility,
  checkStudentEligibility,

  // Progress
  calculateProgress,
  getComponentName,
  calculateAttemptProgress,
  areAllComponentsCompleted,
  getRemainingComponents,

  // Sorting & Filtering
  sortMockDrives,
  filterMockDrivesByStatus,
  groupMockDrivesByStatus,
  filterEligibleMockDrives,

  // Topic & Quality
  groupByTopic,
  getQualityColor,
  getQualityLabel,
  calculateSuccessRate,
  formatSuccessRate,

  // Batch Management
  canAttemptBasedOnBatch,
  getTimeUntilBatchStarts,
  getRemainingBatchTime,
  formatBatchTimeSlot,
  getBatchCapacityPercentage,
  getAvailableBatchSlots,
  isBatchFull,
  getBatchStatus,
  formatBatchTimeRemaining,
  validateBatchCapacity,

  // Scores & Grades
  getScoreColor,
  getScoreBgColor,
  getGrade,
  formatScore,
  calculatePercentage,

  // Validation
  validateMockDriveDates,
  checkBatchTimeOverlap,

  // Config
  getTotalAptitudeQuestions,
  getTotalMachineTestProblems,
  calculateTotalDuration,
  getComponentCount,

  // Display
  truncateText,
  formatNumber,
  getOrdinalSuffix,
  formatPercentile,
  formatList,
  getProgressBarColor,
  formatFileSize,

  // Sequential Flow
  getFlowSteps,
  isCurrentComponent,
  isComponentAccessible,
  getComponentRoute,

  // Analytics
  calculateAverage,
  calculateMedian,
  groupAndCount,
  calculateStandardDeviation,
};