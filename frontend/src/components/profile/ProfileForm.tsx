'use client';

import { useState, useCallback, memo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Loader2, X, ChevronDown, Plus } from 'lucide-react';

import type { ProfileWithSkills, UpdateProfileDto } from '@/types';
import { apiPut } from '@/lib/api/client';
import { useUI } from '@/contexts/UIContext';

interface ProfileFormProps {
  currentProfile: ProfileWithSkills | null;
  onSave: (updatedProfile: ProfileWithSkills) => void;
  onCancel: () => void;
}

/**
 * Validates URL format
 */
const isValidUrl = (value?: string | null) => {
  if (!value || value.trim() === '') return true;
  try {
    const url = value.startsWith('http') ? value : `https://${value}`;
    new URL(url);
    return true;
  } catch {
    return 'Please enter a valid URL (e.g., https://example.com)';
  }
};

/**
 * Converts value to number or undefined
 */
const toNumberOrUndefined = (value: any): number | undefined => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(num) ? undefined : num;
};

/**
 * Validates percentage value (0-100)
 */
const validatePercentage = (value: string | number | string[] | null | undefined): true | string => {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'number') return true;
  if (value < 0) return 'Must be at least 0';
  if (value > 100) return 'Must be at most 100';
  return true;
};

/**
 * Validates CGPA value (0-10)
 */
const validateCgpa = (value: string | number | string[] | null | undefined): true | string => {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'number') return true;
  if (value < 0) return 'Must be at least 0';
  if (value > 10) return 'Must be at most 10';
  return true;
};

/**
 * Validates graduation year
 */
const validateGraduationYear = (value: string | number | string[] | null | undefined): true | string => {
  if (value === undefined || value === null || value === '') return 'Graduation year is required';
  if (typeof value !== 'number') return 'Must be a valid year';
  if (value < 2000) return 'Year must be 2000 or later';
  if (value > 2050) return 'Year must be 2050 or earlier';
  return true;
};

/**
 * Cleans form data by removing empty, null, undefined, and NaN values
 */
const cleanFormData = (data: any): UpdateProfileDto => {
  const cleaned: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip null, undefined, empty strings
    if (value === null || value === undefined || value === '') {
      return;
    }
    
    // Skip NaN values (from empty number inputs)
    if (typeof value === 'number' && Number.isNaN(value)) {
      return;
    }
    
    // Keep the value
    cleaned[key] = value;
  });
  
  return cleaned as UpdateProfileDto;
};

function ProfileForm({ currentProfile, onSave, onCancel }: ProfileFormProps) {
  const { showToast } = useUI();
  const initialSkills = currentProfile?.skills?.map(skill => skill.name) || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileDto>({
    defaultValues: {
      fullName: currentProfile?.fullName || '',
      graduationYear: currentProfile?.graduationYear || undefined,
      linkedinUrl: currentProfile?.linkedinUrl || '',
      githubUrl: currentProfile?.githubUrl || '',
      websiteUrl: currentProfile?.websiteUrl || '',
      sscPercentage: currentProfile?.sscPercentage || undefined,
      hscPercentage: currentProfile?.hscPercentage || undefined,
      diplomaPercentage: currentProfile?.diplomaPercentage || undefined,
      degreeSem1Cgpa: currentProfile?.degreeSem1Cgpa || undefined,
      degreeSem2Cgpa: currentProfile?.degreeSem2Cgpa || undefined,
      degreeSem3Cgpa: currentProfile?.degreeSem3Cgpa || undefined,
      degreeSem4Cgpa: currentProfile?.degreeSem4Cgpa || undefined,
      degreeSem5Cgpa: currentProfile?.degreeSem5Cgpa || undefined,
      degreeSem6Cgpa: currentProfile?.degreeSem6Cgpa || undefined,
      degreeSem7Cgpa: currentProfile?.degreeSem7Cgpa || undefined,
      degreeSem8Cgpa: currentProfile?.degreeSem8Cgpa || undefined,
      skills: initialSkills,
    },
  });

  const [skillInput, setSkillInput] = useState('');
  const skills = watch('skills') || [];
  const hscPercentage = watch('hscPercentage');
  const diplomaPercentage = watch('diplomaPercentage');

  const handleAddSkill = useCallback(
    (e?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
      if (e) {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
      }

      const trimmedSkill = skillInput.trim();
      if (trimmedSkill && !skills.includes(trimmedSkill)) {
        setValue('skills', [...skills, trimmedSkill], { shouldValidate: true });
        setSkillInput('');
      }
    },
    [skillInput, skills, setValue]
  );

  const handleRemoveSkill = useCallback(
    (skillToRemove: string) => {
      setValue(
        'skills',
        skills.filter((skill) => skill !== skillToRemove),
        { shouldValidate: true }
      );
    },
    [skills, setValue]
  );

  const onSubmit: SubmitHandler<UpdateProfileDto> = useCallback(
    async (data) => {
      try {
        // Clean data - remove empty values and NaN
        const cleanedData = cleanFormData(data);

        console.log('Raw form data:', data);
        console.log('Cleaned data being sent to API:', cleanedData);

        const updatedProfile = await apiPut<ProfileWithSkills>(
          '/profile/me',
          cleanedData
        );

        showToast({
          type: 'success',
          message: 'Profile updated successfully',
        });

        onSave(updatedProfile);
      } catch (error: any) {
        console.error('Failed to update profile:', error);
        showToast({
          type: 'error',
          message: error.message || 'Failed to update profile',
        });
      }
    },
    [onSave, showToast]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="graduationYear" className="block text-sm font-medium text-foreground mb-2">
              Graduation Year <span className="text-destructive">*</span>
            </label>
            <input
              id="graduationYear"
              type="number"
              {...register('graduationYear', {
                required: 'Graduation year is required',
                setValueAs: toNumberOrUndefined,
                validate: validateGraduationYear,
              })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder={new Date().getFullYear().toString()}
            />
            {errors.graduationYear && (
              <p className="mt-1 text-sm text-destructive">
                {errors.graduationYear.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      <details className="group border-t pt-6" open>
        <summary className="flex justify-between items-center cursor-pointer list-none">
          <h3 className="text-lg font-semibold text-foreground">Social Links</h3>
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div>
            <label htmlFor="linkedinUrl" className="block text-sm font-medium text-foreground mb-2">
              LinkedIn URL
            </label>
            <input
              id="linkedinUrl"
              type="text"
              {...register('linkedinUrl', { validate: isValidUrl })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="linkedin.com/in/username"
            />
            {errors.linkedinUrl && (
              <p className="mt-1 text-sm text-destructive">{errors.linkedinUrl.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="githubUrl" className="block text-sm font-medium text-foreground mb-2">
              GitHub URL
            </label>
            <input
              id="githubUrl"
              type="text"
              {...register('githubUrl', { validate: isValidUrl })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="github.com/username"
            />
            {errors.githubUrl && (
              <p className="mt-1 text-sm text-destructive">{errors.githubUrl.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-foreground mb-2">
              Personal Website
            </label>
            <input
              id="websiteUrl"
              type="text"
              {...register('websiteUrl', { validate: isValidUrl })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="yoursite.com"
            />
            {errors.websiteUrl && (
              <p className="mt-1 text-sm text-destructive">{errors.websiteUrl.message}</p>
            )}
          </div>
        </div>
      </details>

      {/* Academic Performance */}
      <details className="group border-t pt-6" open>
        <summary className="flex justify-between items-center cursor-pointer list-none">
          <h3 className="text-lg font-semibold text-foreground">Academic Performance</h3>
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
        </summary>
        
        <div className="space-y-4 pt-4">
          {/* School */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="sscPercentage" className="block text-sm font-medium text-foreground mb-2">
                SSC Percentage
              </label>
              <input
                id="sscPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('sscPercentage', {
                  setValueAs: toNumberOrUndefined,
                  validate: validatePercentage,
                })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="85.50"
              />
              {errors.sscPercentage && (
                <p className="mt-1 text-sm text-destructive">{errors.sscPercentage.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="hscPercentage" className="block text-sm font-medium text-foreground mb-2">
                HSC Percentage
              </label>
              <input
                id="hscPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('hscPercentage', {
                  setValueAs: toNumberOrUndefined,
                  validate: validatePercentage,
                })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="78.25"
                disabled={diplomaPercentage !== undefined && diplomaPercentage !== null}
              />
              {diplomaPercentage !== undefined && diplomaPercentage !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Disabled because Diploma is filled
                </p>
              )}
              {errors.hscPercentage && (
                <p className="mt-1 text-sm text-destructive">{errors.hscPercentage.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="diplomaPercentage" className="block text-sm font-medium text-foreground mb-2">
                Diploma Percentage
              </label>
              <input
                id="diplomaPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('diplomaPercentage', {
                  setValueAs: toNumberOrUndefined,
                  validate: validatePercentage,
                })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="82.75"
                disabled={hscPercentage !== undefined && hscPercentage !== null}
              />
              {hscPercentage !== undefined && hscPercentage !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Disabled because HSC is filled
                </p>
              )}
              {errors.diplomaPercentage && (
                <p className="mt-1 text-sm text-destructive">{errors.diplomaPercentage.message}</p>
              )}
            </div>
          </div>

          {/* Degree Semesters */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Degree CGPA by Semester</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <div key={sem}>
                  <label
                    htmlFor={`degreeSem${sem}Cgpa`}
                    className="block text-xs font-medium text-muted-foreground mb-1"
                  >
                    Semester {sem}
                  </label>
                  <input
                    id={`degreeSem${sem}Cgpa`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    {...register(`degreeSem${sem}Cgpa` as keyof UpdateProfileDto, {
                      setValueAs: toNumberOrUndefined,
                      validate: validateCgpa,
                    })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm"
                    placeholder="8.5"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Skills */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Skills</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
            className="flex-grow px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="e.g., React, Python, Machine Learning"
          />
          <button
            type="button"
            onClick={(e) => handleAddSkill(e)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2 min-h-[2.5rem]">
          {skills.length > 0 ? (
            skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-sm font-medium px-3 py-1.5 rounded-full border border-primary/20 animate-in fade-in-0 zoom-in-95"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-primary/70 hover:text-primary transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              No skills added yet. Start typing and press Enter or click Add.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed shadow-md"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default memo(ProfileForm);