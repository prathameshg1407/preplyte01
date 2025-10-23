'use client';

import { X, Mail, GraduationCap, Building, Calendar, Activity, Award, Code, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { FullUserProfile, StudentStats } from '@/types';
import { getUserById, getMyStats } from '@/lib/api/users.client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRoleBadgeClass, getRoleDisplayName } from '@/lib/utils/user-helpers';


interface UserDetailModalProps {
  user: FullUserProfile | { id: string };
  onClose: () => void;
}

export default function UserDetailModal({ user: initialUser, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<FullUserProfile | null>('id' in initialUser && !('profile' in initialUser) ? null : initialUser as FullUserProfile);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFullProfile = async () => {
      if (!user && 'id' in initialUser) {
        setLoading(true);
        try {
          const fullProfile = await getUserById(initialUser.id);
          setUser(fullProfile);
          
          // Load stats if student
          if (fullProfile.role === 'STUDENT') {
            const userStats = await getMyStats();
            setStats(userStats);
          }
        } catch (error) {
          console.error('Failed to load user:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadFullProfile();
  }, [initialUser]);

  if (loading || !user) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-card rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b p-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <img
              src={
                user.profile?.profileImageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.profile?.fullName || user.email
                )}&size=80`
              }
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-primary"
            />
            <div>
              <h2 className="text-2xl font-bold">{user.profile?.fullName || 'Profile Incomplete'}</h2>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge className={getRoleBadgeClass(user.role)}>
                  {getRoleDisplayName(user.role)}
                </Badge>
                <Badge variant="outline">{user.status}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              {stats && <TabsTrigger value="stats">Statistics</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Profile Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity size={18} />
                  Profile Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {user.institution && (
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building size={14} />
                        Institution
                      </div>
                      <div className="font-medium">{user.institution.name}</div>
                    </div>
                  )}
                  {user.profile?.graduationYear && (
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <GraduationCap size={14} />
                        Graduation Year
                      </div>
                      <div className="font-medium">{user.profile.graduationYear}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar size={14} />
                      Joined
                    </div>
                    <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                  {user.lastLoginAt && (
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Activity size={14} />
                        Last Login
                      </div>
                      <div className="font-medium">{new Date(user.lastLoginAt).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {user.profile?.skills && user.profile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.profile.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic Scores */}
              {user.profile && (
                <div>
                  <h3 className="font-semibold mb-3">Academic Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {user.profile.sscPercentage && (
                      <div>
                        <div className="text-sm text-muted-foreground">SSC</div>
                        <div className="font-medium">{user.profile.sscPercentage}%</div>
                      </div>
                    )}
                    {user.profile.hscPercentage && (
                      <div>
                        <div className="text-sm text-muted-foreground">HSC</div>
                        <div className="font-medium">{user.profile.hscPercentage}%</div>
                      </div>
                    )}
                    {user.profile.averageCgpa && (
                      <div>
                        <div className="text-sm text-muted-foreground">CGPA</div>
                        <div className="font-medium">{user.profile.averageCgpa}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {/* Activity Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Code size={16} />
                    Coding Tests
                  </div>
                  <div className="text-2xl font-bold">{user._count?.machineTestSubmissions || 0}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Award size={16} />
                    AI Interviews
                  </div>
                  <div className="text-2xl font-bold">{user._count?.aiInterviewSessions || 0}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Briefcase size={16} />
                    Applications
                  </div>
                  <div className="text-2xl font-bold">{user._count?.jobApplications || 0}</div>
                </div>
              </div>

              {/* Recent Activity */}
              {user.topicPerformance && user.topicPerformance.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Top Performance</h3>
                  <div className="space-y-2">
                    {user.topicPerformance.slice(0, 5).map((perf, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <span className="font-medium">{perf.tag.name}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">Score: {perf.averageScore}</span>
                          <span className="text-muted-foreground">Accuracy: {perf.accuracy}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {stats && (
              <TabsContent value="stats">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Performance Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">Aptitude Average</div>
                        <div className="text-2xl font-bold">{stats.aptitudeTests.averageScore}%</div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">Coding Success Rate</div>
                        <div className="text-2xl font-bold">{stats.machineTests.averageSuccessRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}