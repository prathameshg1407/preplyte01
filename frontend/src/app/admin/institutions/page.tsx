'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building, Loader2, PlusCircle, ShieldAlert, ChevronLeft, ChevronRight, Search, ArrowRight } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Institution } from '@/types';
import { Role } from '@/types/enum';
import AddInstitutionModal from '@/components/admin/AddInstitutionModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type InstitutionWithCount = Institution & {
  _count: {
    users: number;
    mockDrives?: number;
  };
  createdAt: string; // ✅ add this
};

// Custom hook to debounce a value
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function ManageInstitutionsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [institutions, setInstitutions] = useState<InstitutionWithCount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // --- REFACTORED USEEFFECT HOOKS ---

  // 1. Effect for handling authorization and redirects
  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || user?.role !== Role.SUPER_ADMIN)) {
      router.push('/admin/dashboard');
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  // 2. Effect for fetching data when page or search term changes
  useEffect(() => {
    // Only fetch if the user is authorized
    if (isAuthenticated && user?.role === Role.SUPER_ADMIN) {
      const fetchInstitutions = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const skip = (page - 1) * pageSize;
          const url = new URL(`${API_URL}/v1/institutions`);
          url.searchParams.append('skip', String(skip));
          url.searchParams.append('take', String(pageSize));
          if (debouncedSearchTerm) {
            url.searchParams.append('search', debouncedSearchTerm);
          }
          
          // THE FIX: Added `null` as the second argument to fetchWithAuth
          const data = await fetchWithAuth<{ institutions: InstitutionWithCount[], total: number }>(url.toString());
          setInstitutions(data.institutions);
          setTotal(data.total);
        } catch (err: any) {
          setError(err.message || 'Failed to load institutions.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchInstitutions();
    }
  }, [page, pageSize, debouncedSearchTerm, isAuthenticated, user]);

  // 3. Effect for resetting the page number when a new search is performed
  useEffect(() => {
    if (searchTerm) {
      setPage(1);
    }
  }, [debouncedSearchTerm]);


  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Building size={32} />
              <span>Institutions</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Browse and manage partner institutions.</p>
          </div>

          <div className="flex-grow flex justify-center w-full md:w-auto">
            <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors w-full justify-center md:w-auto"
            >
              <PlusCircle size={20} />
              Add Institution
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-destructive p-4 bg-destructive/10 rounded-lg">
            <ShieldAlert className="w-12 h-12 mb-4" />
            <h2 className="text-xl font-bold">Failed to load data</h2>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {institutions.length > 0 ? institutions.map((inst) => (
                <Link key={inst.id} href={`/admin/institutions/${inst.id}`} className="block group">
                  <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary">
                      <div className="p-5">
                          <div className="flex items-center gap-4 mb-5">
                              <img 
                                  src={inst.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inst.name)}&background=e2e8f0&color=475569&size=64`}
                                  alt={`${inst.name} Logo`}
                                  className="w-16 h-16 rounded-md object-contain bg-muted/50 p-1 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                  <h2 className="text-lg font-bold text-foreground truncate transition-colors duration-300 group-hover:text-primary">{inst.name}</h2>
                                  <p className="text-sm text-muted-foreground">{inst.domain}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-center my-5">
                              <div>
                                  <p className="text-2xl font-bold text-foreground">{inst._count.users}</p>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Users</p>
                              </div>
                              <div>
                                  <p className="text-2xl font-bold text-foreground">{inst._count.mockDrives ?? 0}</p>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Mock Drives</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="bg-muted/50 px-5 py-3 border-t border-border flex justify-between items-center">
                           <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>Joined on {new Date(inst.createdAt).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span>Manage</span>
                              <ArrowRight size={16} className="-translate-x-1 group-hover:translate-x-0 transition-transform duration-300" />
                           </div>
                      </div>
                  </div>
                </Link>
              )) : (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 text-muted-foreground">
                  <p>No institutions found{debouncedSearchTerm ? ` for "${debouncedSearchTerm}"` : ''}.</p>
                </div>
              )}
            </div>

            {total > pageSize && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-muted-foreground">
                  Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"><ChevronLeft className="h-5 w-5"/></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"><ChevronRight className="h-5 w-5"/></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <AddInstitutionModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            // After adding, go to page 1 to see the new institution
            if (page !== 1) setPage(1); 
            // Re-fetch the data
            // We can't call fetchInstitutions directly here, so we might need a refresh function
            // A simple way is to just reload, but a better way is to have a refresh state
            window.location.reload(); // Simple but effective for now
          }}
        />
      )}
    </>
  );
}