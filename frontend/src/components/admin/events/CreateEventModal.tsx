// src/components/admin/events/CreateEventModal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
    CreateJobPostingDto, 
    CreateInternshipPostingDto, 
    CreateHackathonPostingDto,
    JobPosting, 
    InternshipPosting, 
    HackathonPosting,
    EligibilityCriteria,
} from '@/types';
import { createJobPosting, createInternshipPosting, createHackathonPosting } from '@/lib/api/event.client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type EventType = 'job' | 'internship' | 'hackathon';
type CreateEventDto = CreateJobPostingDto | CreateInternshipPostingDto | CreateHackathonPostingDto;
type EventPosting = JobPosting | InternshipPosting | HackathonPosting;

interface CreateEventModalProps {
    type: EventType;
    onClose: () => void;
    onSuccess: (newEvent: EventPosting, type: EventType) => void;
}

const getTitle = (type: EventType) => {
    switch (type) {
        case 'job': return 'Create New Job Posting';
        case 'internship': return 'Create New Internship Posting';
        case 'hackathon': return 'Create New Hackathon Event';
    }
};

export default function CreateEventModal({ type, onClose, onSuccess }: CreateEventModalProps) {
    const [showEligibility, setShowEligibility] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateEventDto>();

    const onSubmit = async (data: CreateEventDto) => {
        try {
            let newEvent: EventPosting;
            
            // Prepare the payload, handling eligibility criteria
            const payload: any = { ...data };
            if (!showEligibility || !payload.eligibilityCriteria) {
                payload.eligibilityCriteria = null;
            } else {
                // Clean up eligibility criteria: convert years string to number array and remove empty fields
                const criteria = payload.eligibilityCriteria as any;
                const cleanedCriteria: Partial<EligibilityCriteria> = {};

                if (criteria.graduationYears) {
                    cleanedCriteria.graduationYears = String(criteria.graduationYears).split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
                }
                if (criteria.minSscPercentage) cleanedCriteria.minSscPercentage = Number(criteria.minSscPercentage);
                if (criteria.minHscPercentage) cleanedCriteria.minHscPercentage = Number(criteria.minHscPercentage);
                if (criteria.minAverageCgpa) cleanedCriteria.minAverageCgpa = Number(criteria.minAverageCgpa);
                
                payload.eligibilityCriteria = Object.keys(cleanedCriteria).length > 0 ? cleanedCriteria : null;
            }

            switch (type) {
                case 'job':
                    newEvent = await createJobPosting(payload as CreateJobPostingDto);
                    break;
                case 'internship':
                    newEvent = await createInternshipPosting(payload as CreateInternshipPostingDto);
                    break;
                case 'hackathon':
                    newEvent = await createHackathonPosting(payload as CreateHackathonPostingDto);
                    break;
            }
            
            toast.success(`'${type.charAt(0).toUpperCase() + type.slice(1)}' created successfully!`);
            onSuccess(newEvent, type);
        } catch (error: any) {
            toast.error(`Failed to create ${type}`, { description: error.message });
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{getTitle(type)}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {/* Core Details */}
                    <Input placeholder="Title" {...register("title", { required: "Title is required." })} />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                    <Textarea placeholder="Full description..." {...register("description", { required: "Description is required." })} />
                    {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}

                    {/* Dynamic fields based on event type */}
                    {type === 'job' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="Location (e.g., Mumbai, IN)" {...register("location")} />
                            <Input placeholder="Salary (e.g., ₹10,00,000 LPA)" {...register("salary")} />
                        </div>
                    )}
                    {type === 'internship' && (
                         <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="Location (e.g., Remote)" {...register("location")} />
                            <Input placeholder="Stipend (e.g., ₹25,000 / month)" {...register("stipend")} />
                        </div>
                    )}
                    {type === 'hackathon' && (
                        <div className="grid grid-cols-2 gap-4">
                           <Input placeholder="Location (e.g., Online)" {...register("location")} />
                           <Input placeholder="Prizes (e.g., ₹1,00,000 Prize Pool)" {...register("prizes")} />
                        </div>
                    )}

                    {/* Common date fields */}
                    {type !== 'hackathon' && (
                        <div>
                            <Label htmlFor="applicationDeadline">Application Deadline</Label>
                            <Input id="applicationDeadline" type="date" {...register("applicationDeadline")} />
                        </div>
                    )}
                     {type === 'hackathon' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input id="startDate" type="date" {...register("startDate")} />
                            </div>
                             <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input id="endDate" type="date" {...register("endDate")} />
                            </div>
                        </div>
                    )}

                    {/* Eligibility Criteria Section */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="eligibility-switch" className="font-semibold">Set Eligibility Criteria</Label>
                            <Switch id="eligibility-switch" checked={showEligibility} onCheckedChange={setShowEligibility} />
                        </div>
                        {showEligibility && (
                            <div className="space-y-4 pt-4 border-t animate-in fade-in-0 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Input type="number" step="0.01" placeholder="Min SSC %" {...register("eligibilityCriteria.minSscPercentage", { valueAsNumber: true })} />
                                    <Input type="number" step="0.01" placeholder="Min HSC %" {...register("eligibilityCriteria.minHscPercentage", { valueAsNumber: true })} />
                                    <Input type="number" step="0.01" placeholder="Min Avg. CGPA" {...register("eligibilityCriteria.minAverageCgpa", { valueAsNumber: true })} />
                                </div>
                                <div>
                                    <Label htmlFor="graduationYears">Allowed Graduation Years</Label>
                                    <Input id="graduationYears" placeholder="e.g., 2024, 2025" {...register("eligibilityCriteria.graduationYears")} />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Posting
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
