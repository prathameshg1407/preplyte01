'use client';

import { X, Mail, GraduationCap, BarChart2, Code, Award, CheckCircle } from 'lucide-react';

import { AppUser } from '@/types';

// Define the type for a student with their activity counts
type StudentWithStats = AppUser & {
  _count: {
    mockDriveParticipants: number;
    codingSubmissions: number;
  };
};

interface StudentDetailModalProps {
  student: StudentWithStats;
  onClose: () => void;
}

export default function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl relative m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={20} />
        </button>
        
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <img 
                    src={student.profile?.profileImageUrl || `https://placehold.co/80x80/e2e8f0/475569?text=${student.profile?.fullName?.charAt(0) || 'S'}`} 
                    alt="Student Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                />
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{student.profile?.fullName}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Mail size={14} />
                        <span>{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap size={14} />
                        <span>Graduating in {student.profile?.graduationYear}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award size={16} />
                        <span>Total Points</span>
                    </div>
                    <p className="text-3xl font-bold mt-1">{student.totalPoints}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle size={16} />
                        <span>Mock Drives Completed</span>
                    </div>
                    <p className="text-3xl font-bold mt-1">{student._count.mockDriveParticipants}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Code size={16} />
                        <span>Coding Submissions</span>
                    </div>
                    <p className="text-3xl font-bold mt-1">{student._count.codingSubmissions}</p>
                </div>
                {/* Add more stats here as needed, e.g., aptitude tests */}
            </div>
            
            {/* Placeholder for more detailed charts or lists */}
            <div className="mt-8">
                <h3 className="font-bold text-lg">Performance History</h3>
                <div className="mt-4 p-6 bg-muted/50 rounded-lg text-center text-muted-foreground">
                    <BarChart2 className="mx-auto mb-2" size={32} />
                    <p>Detailed performance charts and history will be available here.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
