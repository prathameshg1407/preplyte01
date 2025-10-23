'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building, Loader2, ShieldAlert, Users, CalendarCheck, UserCheck } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Institution, AppUser as User } from '@/types';
import { Role } from '@/types/enum';
import StudentDetailModal from '@/components/admin/user/StudentDetailModal';
import UserList from '@/components/admin/user/UserList';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type StudentWithStats = User & {
  _count: {
    mockDriveParticipants: number;
    codingSubmissions: number;
  };
};

type DetailedInstitution = Institution & {
  admins: User[];
  students: StudentWithStats[];
  _count: {
    users: number;
    mockDrives: number;
  };
};

type ActiveTab = 'students' | 'admins';

export default function InstitutionDetailPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [institution, setInstitution] = useState<DetailedInstitution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);

  const fetchInstitutionDetails = useCallback(async () => {
    if (!id || isNaN(parseInt(id))) {
      setError('Invalid institution ID.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth<DetailedInstitution>(`${API_URL}/v1/institutions/${id}/details`);
      setInstitution(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load institution details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || (user.role !== Role.SUPER_ADMIN && user.institution?.id !== parseInt(id))) {
        router.push('/dashboard');
      } else if (isNaN(parseInt(id))) {
        setError('Invalid institution ID.');
        setIsLoading(false);
      } else {
        fetchInstitutionDetails();
      }
    }
  }, [user, isAuthLoading, router, fetchInstitutionDetails, id]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-destructive">
        <ShieldAlert className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold">Failed to load data</h2>
        <p>{error}</p>
        <Link href="/admin/institutions" className="mt-4 text-primary hover:underline">
          Back to Institutions
        </Link>
      </div>
    );
  }

  if (!institution) return null;

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <img 
              src={institution.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(institution.name)}&background=e2e8f0&color=475569&size=96`} 
              alt={`${institution.name} Logo`}
              className="w-24 h-24 rounded-lg object-contain bg-gray-100 p-2 border"
            />
            <div>
              <h1 className="text-4xl font-bold text-foreground">{institution.name}</h1>
              <p className="mt-1 text-lg text-muted-foreground">{institution.domain}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users size={16}/>
              Total Members
            </div>
            <p className="text-3xl font-bold text-foreground mt-1">{institution._count.users}</p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarCheck size={16}/>
              Mock Drives
            </div>
            <p className="text-3xl font-bold text-foreground mt-1">{institution._count.mockDrives}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <div className="border-b border-border">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-2 py-4 px-6 font-semibold border-b-2 transition-colors ${
                  activeTab === 'students' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserCheck size={18}/> 
                Students ({institution.students.length})
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`flex items-center gap-2 py-4 px-6 font-semibold border-b-2 transition-colors ${
                  activeTab === 'admins' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShieldAlert size={18}/> 
                Admins ({institution.admins.length})
              </button>
            </nav>
          </div>
          
          {activeTab === 'students' && (
            <UserList 
              users={institution.students} 
              role="Student"
              onUserClick={(user: User) => setSelectedStudent(user as StudentWithStats)}
              onRoleChangeSuccess={fetchInstitutionDetails}
            />
          )}
          
          {activeTab === 'admins' && (
            <UserList 
              users={institution.admins} 
              role="Admin" 
              onRoleChangeSuccess={fetchInstitutionDetails}
            />
          )}
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </>
  );
}