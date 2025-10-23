// ============================================
// Profile Types (Resume Data)
// ============================================

export interface Education {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade?: number;
    description?: string;
  }
  
  export interface Experience {
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    location?: string;
    responsibilities: string[];
  }
  
  export interface Project {
    name: string;
    description: string;
    link?: string;
    technologies: string[];
    duration?: string;
  }
  
  export interface Certification {
    name: string;
    issuer: string;
    date: string;
    verificationUrl?: string;
  }
  
  export interface ResumeProfileData {
    fullName: string;
    email: string;
    phone: string;
    headline?: string;
    summary?: string;
    address?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    education: Education[];
    experience: Experience[];
    projects: Project[];
    skills: string[];
    certifications: Certification[];
    languages: string[];
    achievements: string[];
  }
  
  // Alias for backward compatibility
  export type UserProfile = ResumeProfileData;
  
  // ============================================
  // Template Types
  // ============================================
  
  export type TemplateType = 
    | 'modern' 
    | 'minimal' 
    | 'professional' 
    | 'creative' 
    | 'corporate' 
    | 'elegant';
  
  export interface ResumeTemplate {
    id: TemplateType;
    name: string;
    description: string;
    preview: string; // HTML string for preview
    thumbnail?: string; // Optional thumbnail image
  }
  
  export interface TemplateCustomization {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    margin?: number;
    showProfileImage?: boolean;
    showSocialLinks?: boolean;
    dateFormat?: 'MM/YYYY' | 'Mon YYYY' | 'Month YYYY';
  }
  
  export interface GenerateResumeOptions {
    template: TemplateType;
    profileData?: ResumeProfileData; // Optional for when it's passed separately
    primaryColor?: string;
    fontFamily?: string;
    sectionsOrder?: ResumeSection[];
    hiddenSections?: ResumeSection[];
    customization?: TemplateCustomization;
  }
  
  export type ResumeSection = 
    | 'summary'
    | 'experience'
    | 'education'
    | 'skills'
    | 'projects'
    | 'certifications'
    | 'languages'
    | 'achievements';
  
  // ============================================
  // Resume Management Types
  // ============================================
  
  export interface SavedResume {
    id: number;
    userId: string;
    title: string;
    filename?: string | null;
    storagePath: string;
    content?: string | null;
    analysisStatus: ResumeAnalysisStatus;
    isPrimary: boolean;
    uploadedAt: string;
    updatedAt: string;
  }
  
  export interface SaveResumeDataRequest {
    title: string;
    profileData: ResumeProfileData;
    template?: TemplateType;
    customSettings?: Partial<GenerateResumeOptions>;
  }
  
  export interface UpdateResumeDataRequest {
    title?: string;
    profileData?: Partial<ResumeProfileData>;
    template?: TemplateType;
    customSettings?: Partial<GenerateResumeOptions>;
  }
  
  // Backward compatibility
  export interface SaveResumeRequest extends SaveResumeDataRequest {}
  
  export interface ResumeContent {
    profileData: ResumeProfileData;
    template: TemplateType;
    customSettings?: Partial<GenerateResumeOptions>;
  }
  
  export enum ResumeAnalysisStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
  }
  
  // ============================================
  // ATS Score Types
  // ============================================
  
  export interface ATSAnalysis {
    atsScore: number;
    keywordsFound: string[];
    keywordsMissing: string[];
    formatScore: number;
    suggestions: string[];
  }
  
  export interface ATSCheckRequest {
    resumeFile: File;
    jobRole: string;
  }
  
  // ============================================
  // API Response Types
  // ============================================
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }
  
  export interface ResumeSaveResponse {
    message: string;
    resume: SavedResume;
  }
  
  export interface TemplateListResponse {
    templates: ResumeTemplate[];
  }
  
  export interface GeneratePreviewResponse {
    preview: string; // Base64 encoded PDF
    template: TemplateType;
  }
  
  export interface SavedResumesResponse {
    resumes: SavedResume[];
    total: number;
  }
  
  export interface ResumeStatsResponse {
    totalResumes: number;
    templatesUsed: Record<string, number>;
    lastGenerated?: string;
    averageATSScore?: number;
  }
  
  // ============================================
  // Form Types for UI
  // ============================================
  
  export interface EducationFormData extends Omit<Education, 'grade'> {
    grade: string; // For form input, then convert to number
  }
  
  export interface ExperienceFormData extends Experience {
    currentlyWorking: boolean;
  }
  
  export interface ResumeFormData extends Omit<ResumeProfileData, 'education' | 'experience'> {
    education: EducationFormData[];
    experience: ExperienceFormData[];
  }
  
  // ============================================
  // UI State Types
  // ============================================
  
  export interface ResumeBuilderState {
    currentResumeData: ResumeProfileData | null;
    selectedTemplate: TemplateType | null;
    templates: ResumeTemplate[];
    savedResumes: SavedResume[];
    currentResume: SavedResume | null;
    isLoading: boolean;
    isSaving: boolean;
    isGenerating: boolean;
    error: string | null;
    previewData: string | null; // Base64 PDF for preview
    customization: GenerateResumeOptions;
    activeSection: ResumeSection | null;
    sectionOrder: ResumeSection[];
    hiddenSections: ResumeSection[];
  }
  
  export interface TemplatePreviewProps {
    data: ResumeProfileData & { template: TemplateType };
  }
  
  export interface TemplateCardProps {
    template: ResumeTemplate;
    isSelected: boolean;
    onSelect: (templateId: TemplateType) => void;
  }
  
  export interface SectionEditorProps {
    section: ResumeSection;
    data: any; // Type depends on section
    onChange: (data: any) => void;
    onReorder?: (direction: 'up' | 'down') => void;
    onToggleVisibility?: () => void;
    isVisible: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
  }
  
  // ============================================
  // Validation Types
  // ============================================
  
  export interface ValidationError {
    field: string;
    message: string;
  }
  
  export interface ResumeValidation {
    isValid: boolean;
    errors: ValidationError[];
    warnings: string[];
  }
  
  export interface ResumeCompleteness {
    percentage: number;
    missingRequiredFields: string[];
    missingOptionalFields: string[];
  }
  
  // ============================================
  // Action Types for State Management
  // ============================================
  
  export enum ResumeBuilderActionType {
    SET_RESUME_DATA = 'SET_RESUME_DATA',
    UPDATE_RESUME_DATA = 'UPDATE_RESUME_DATA',
    SET_TEMPLATES = 'SET_TEMPLATES',
    SELECT_TEMPLATE = 'SELECT_TEMPLATE',
    SET_SAVED_RESUMES = 'SET_SAVED_RESUMES',
    ADD_SAVED_RESUME = 'ADD_SAVED_RESUME',
    DELETE_SAVED_RESUME = 'DELETE_SAVED_RESUME',
    SET_CURRENT_RESUME = 'SET_CURRENT_RESUME',
    SET_PREVIEW_DATA = 'SET_PREVIEW_DATA',
    UPDATE_CUSTOMIZATION = 'UPDATE_CUSTOMIZATION',
    REORDER_SECTION = 'REORDER_SECTION',
    TOGGLE_SECTION = 'TOGGLE_SECTION',
    SET_LOADING = 'SET_LOADING',
    SET_SAVING = 'SET_SAVING',
    SET_GENERATING = 'SET_GENERATING',
    SET_ERROR = 'SET_ERROR',
    CLEAR_ERROR = 'CLEAR_ERROR',
    RESET_STATE = 'RESET_STATE'
  }
  
  export type ResumeBuilderAction =
    | { type: ResumeBuilderActionType.SET_RESUME_DATA; payload: ResumeProfileData }
    | { type: ResumeBuilderActionType.UPDATE_RESUME_DATA; payload: Partial<ResumeProfileData> }
    | { type: ResumeBuilderActionType.SET_TEMPLATES; payload: ResumeTemplate[] }
    | { type: ResumeBuilderActionType.SELECT_TEMPLATE; payload: TemplateType }
    | { type: ResumeBuilderActionType.SET_SAVED_RESUMES; payload: SavedResume[] }
    | { type: ResumeBuilderActionType.ADD_SAVED_RESUME; payload: SavedResume }
    | { type: ResumeBuilderActionType.DELETE_SAVED_RESUME; payload: number }
    | { type: ResumeBuilderActionType.SET_CURRENT_RESUME; payload: SavedResume | null }
    | { type: ResumeBuilderActionType.SET_PREVIEW_DATA; payload: string | null }
    | { type: ResumeBuilderActionType.UPDATE_CUSTOMIZATION; payload: Partial<GenerateResumeOptions> }
    | { type: ResumeBuilderActionType.REORDER_SECTION; payload: { section: ResumeSection; direction: 'up' | 'down' } }
    | { type: ResumeBuilderActionType.TOGGLE_SECTION; payload: ResumeSection }
    | { type: ResumeBuilderActionType.SET_LOADING; payload: boolean }
    | { type: ResumeBuilderActionType.SET_SAVING; payload: boolean }
    | { type: ResumeBuilderActionType.SET_GENERATING; payload: boolean }
    | { type: ResumeBuilderActionType.SET_ERROR; payload: string }
    | { type: ResumeBuilderActionType.CLEAR_ERROR }
    | { type: ResumeBuilderActionType.RESET_STATE };
  
  // ============================================
  // API Service Types
  // ============================================
  
  export interface ResumeBuilderAPI {
    // Resume Data Management
    saveResumeData(data: SaveResumeDataRequest): Promise<SavedResume>;
    getSavedResumes(): Promise<SavedResume[]>;
    getResumeDetails(resumeId: number): Promise<SavedResume>;
    updateResumeData(resumeId: number, data: UpdateResumeDataRequest): Promise<SavedResume>;
    deleteResume(resumeId: number): Promise<{ message: string }>;
    duplicateResume(resumeId: number, newTitle: string): Promise<SavedResume>;
    
    // Resume Generation
    generateResume(profileData: ResumeProfileData, options: GenerateResumeOptions): Promise<Blob>;
    generatePreview(profileData: ResumeProfileData, options: GenerateResumeOptions): Promise<GeneratePreviewResponse>;
    downloadResume(resumeId: number): Promise<Blob>;
    
    // ATS Analysis
    checkATSScore(file: File, jobRole: string): Promise<ATSAnalysis>;
    checkSavedResumeATS(resumeId: number, jobRole: string): Promise<ATSAnalysis>;
    
    // Utilities
    getStats(): Promise<ResumeStatsResponse>;
    exportResume(resumeId: number, format: 'pdf' | 'docx' | 'txt'): Promise<Blob>;
    importResume(file: File): Promise<{ success: boolean; resume?: SavedResume; error?: string }>;
  }
  
  // ============================================
  // Utility Types
  // ============================================
  
  export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };
  
  export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
  
  export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  
  export interface ResumeExportOptions {
    format: 'pdf' | 'docx' | 'txt';
    includeWatermark?: boolean;
    compress?: boolean;
  }
  
  export interface ImportResumeResult {
    success: boolean;
    resume?: SavedResume;
    error?: string;
    warnings?: string[];
  }
  
  // ============================================
  // Constants
  // ============================================
  
  export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateCustomization> = {
    modern: {
      primaryColor: '#2b6cb0',
      secondaryColor: '#ffffff',
      fontFamily: 'Helvetica',
      showSocialLinks: true,
      fontSize: 10,
      lineHeight: 1.5,
    },
    minimal: {
      primaryColor: '#000000',
      secondaryColor: '#666666',
      fontFamily: 'Arial',
      showSocialLinks: false,
      fontSize: 10,
      lineHeight: 1.4,
    },
    professional: {
      primaryColor: '#1a3c5e',
      secondaryColor: '#333333',
      fontFamily: 'Times New Roman',
      showSocialLinks: true,
      fontSize: 11,
      lineHeight: 1.5,
    },
    creative: {
      primaryColor: '#dd6b20',
      secondaryColor: '#f97316',
      fontFamily: 'Helvetica',
      showSocialLinks: true,
      fontSize: 10,
      lineHeight: 1.6,
    },
    corporate: {
      primaryColor: '#1a3c5e',
      secondaryColor: '#2c5282',
      fontFamily: 'Georgia',
      showSocialLinks: false,
      fontSize: 11,
      lineHeight: 1.5,
    },
    elegant: {
      primaryColor: '#4a5568',
      secondaryColor: '#718096',
      fontFamily: 'Helvetica',
      showSocialLinks: true,
      fontSize: 10,
      lineHeight: 1.6,
    },
  };
  
  export const DEFAULT_SECTIONS_ORDER: ResumeSection[] = [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'achievements',
  ];
  
  export const SECTION_LABELS: Record<ResumeSection, string> = {
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
    achievements: 'Achievements',
  };
  
  export const SECTION_ICONS: Record<ResumeSection, string> = {
    summary: 'FileText',
    experience: 'Briefcase',
    education: 'GraduationCap',
    skills: 'Code',
    projects: 'Folder',
    certifications: 'Award',
    languages: 'Globe',
    achievements: 'Trophy',
  };
  
  export const FONT_FAMILIES = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Palatino',
    'Garamond',
  ] as const;
  
  export const DATE_FORMATS = {
    'MM/YYYY': 'MM/YYYY',
    'Mon YYYY': 'Mon YYYY',
    'Month YYYY': 'Month YYYY',
  } as const;
  
  export const REQUIRED_FIELDS: (keyof ResumeProfileData)[] = [
    'fullName',
    'email',
    'phone',
  ];
  
  export const OPTIONAL_FIELDS: (keyof ResumeProfileData)[] = [
    'headline',
    'summary',
    'address',
    'linkedinUrl',
    'githubUrl',
    'portfolioUrl',
  ];
  
  // ============================================
  // Helper Type Guards
  // ============================================
  
  export const isEducation = (obj: any): obj is Education => {
    return obj && 
      typeof obj.institution === 'string' &&
      typeof obj.degree === 'string' &&
      typeof obj.field === 'string' &&
      typeof obj.startDate === 'string' &&
      typeof obj.endDate === 'string';
  };
  
  export const isExperience = (obj: any): obj is Experience => {
    return obj &&
      typeof obj.company === 'string' &&
      typeof obj.role === 'string' &&
      typeof obj.startDate === 'string' &&
      Array.isArray(obj.responsibilities);
  };
  
  export const isProject = (obj: any): obj is Project => {
    return obj &&
      typeof obj.name === 'string' &&
      typeof obj.description === 'string' &&
      Array.isArray(obj.technologies);
  };
  
  export const isCertification = (obj: any): obj is Certification => {
    return obj &&
      typeof obj.name === 'string' &&
      typeof obj.issuer === 'string' &&
      typeof obj.date === 'string';
  };
  
  export const isValidTemplate = (template: string): template is TemplateType => {
    return ['modern', 'minimal', 'professional', 'creative', 'corporate', 'elegant'].includes(template);
  };
  
  export const isValidSection = (section: string): section is ResumeSection => {
    return [
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'languages',
      'achievements',
    ].includes(section);
  };
  
  export const isResumeProfileData = (obj: any): obj is ResumeProfileData => {
    return obj &&
      typeof obj.fullName === 'string' &&
      typeof obj.email === 'string' &&
      typeof obj.phone === 'string' &&
      Array.isArray(obj.education) &&
      Array.isArray(obj.experience) &&
      Array.isArray(obj.projects) &&
      Array.isArray(obj.skills);
  };
  
  // ============================================
  // Helper Functions
  // ============================================
  
  export const getEmptyResumeData = (): ResumeProfileData => ({
    fullName: '',
    email: '',
    phone: '',
    headline: '',
    summary: '',
    address: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: [],
    achievements: [],
  });
  
  export const calculateResumeCompleteness = (data: ResumeProfileData): ResumeCompleteness => {
    const missingRequired = REQUIRED_FIELDS.filter(field => !data[field] || data[field] === '');
    const completedOptional = OPTIONAL_FIELDS.filter(field => data[field] && data[field] !== '');
    
    const hasEducation = data.education.length > 0;
    const hasExperience = data.experience.length > 0;
    const hasSkills = data.skills.length > 0;
    
    const totalRequired = REQUIRED_FIELDS.length;
    const totalOptional = OPTIONAL_FIELDS.length + 3; // education, experience, skills
    
    const completedRequired = totalRequired - missingRequired.length;
    const completedOptionalCount = completedOptional.length + 
      (hasEducation ? 1 : 0) + 
      (hasExperience ? 1 : 0) + 
      (hasSkills ? 1 : 0);
    
    const percentage = Math.round(
      ((completedRequired + completedOptionalCount) / (totalRequired + totalOptional)) * 100
    );
    
    const missingOptionalFields: string[] = [];
    if (!hasEducation) missingOptionalFields.push('education');
    if (!hasExperience) missingOptionalFields.push('experience');
    if (!hasSkills) missingOptionalFields.push('skills');
    OPTIONAL_FIELDS.forEach(field => {
      if (!data[field] || data[field] === '') {
        missingOptionalFields.push(field);
      }
    });
    
    return {
      percentage,
      missingRequiredFields: missingRequired,
      missingOptionalFields,
    };
  };
  
  export const validateResumeData = (data: Partial<ResumeProfileData>): ResumeValidation => {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    
    // Required fields validation
    if (!data.fullName || data.fullName.trim() === '') {
      errors.push({ field: 'fullName', message: 'Full name is required' });
    }
    
    if (!data.email || data.email.trim() === '') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    
    if (!data.phone || data.phone.trim() === '') {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    }
    
    // Warnings for missing optional but important fields
    if (!data.summary || data.summary.trim() === '') {
      warnings.push('Consider adding a professional summary to make your resume stand out');
    }
    
    if (!data.education || data.education.length === 0) {
      warnings.push('No education entries added');
    }
    
    if (!data.experience || data.experience.length === 0) {
      warnings.push('No work experience added');
    }
    
    if (!data.skills || data.skills.length === 0) {
      warnings.push('No skills added');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };