'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import {
    BrainCircuit,
    Code,
    Target,
    User,
    Calendar,
    TrendingUp,
    Award,
    FileText,
    CheckCircle,
    Clock,
    Trophy,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import type { FullUserProfile, StudentStats } from '@/types';

interface StudentDashboardProps {
    user: FullUserProfile;
    stats: StudentStats;
}

const StatCard = memo<{
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;
    subtitle?: string;
    color?: string;
}>(({ title, value, icon: Icon, href, subtitle, color = 'text-primary' }) => {
    const content = (
        <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-primary/10 to-transparent rounded-full" />
            
            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                    <div className={`p-2 rounded-lg bg-primary/10`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );

    return href ? (
        <Link href={href} className="block h-full">
            {content}
        </Link>
    ) : (
        content
    );
});
StatCard.displayName = 'StatCard';

const ActionCard = memo<{
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
}>(({ title, description, href, icon: Icon, badge }) => (
    <Link href={href} className="block h-full">
        <div className="group h-full rounded-xl border bg-gradient-to-br from-card to-card/50 p-6 transition-all hover:shadow-lg hover:border-primary/50 hover:from-primary/5">
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                    <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        {badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {description}
                    </p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
        </div>
    </Link>
));
ActionCard.displayName = 'ActionCard';

const PerformanceBar = memo<{
    name: string;
    score: number;
    accuracy: number;
    category: string;
}>(({ name, score, accuracy, category }) => (
    <div className="group p-4 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                    {category}
                </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-green-600">
                    {Math.round(score)}%
                </span>
                <span className="text-muted-foreground">
                    {Math.round(accuracy)}% accuracy
                </span>
            </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                style={{ width: `${score}%` }}
            />
        </div>
    </div>
));
PerformanceBar.displayName = 'PerformanceBar';

function StudentDashboard({ user, stats }: StudentDashboardProps) {
    const userFullName = user.profile?.fullName || 'Student';
    const firstName = userFullName.split(' ')[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">
                            Dashboard
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Welcome back, {firstName}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')} • Ready to level up your skills?
                    </p>
                </div>

                {/* Profile Completion Alert */}
                {stats.profile.completionPercentage < 100 && (
                    <Link href="/profile">
                        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                                        <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            Complete Your Profile
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {stats.profile.completionPercentage}% complete • Add more details to improve visibility
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                    </Link>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Aptitude Tests"
                        value={stats.aptitudeTests.taken}
                        subtitle={`Avg: ${Math.round(stats.aptitudeTests.averageScore)}%`}
                        icon={BrainCircuit}
                        href="/practice/aptitude"
                    />
                    <StatCard
                        title="Coding Challenges"
                        value={stats.machineTests.taken}
                        subtitle={`${stats.machineTests.completed} completed`}
                        icon={Code}
                        href="/practice/coding"
                    />
                    <StatCard
                        title="AI Interviews"
                        value={stats.aiInterviews.completed}
                        subtitle={`Avg score: ${Math.round(stats.aiInterviews.averageScore)}%`}
                        icon={User}
                        href="/practice/interview"
                    />
                    <StatCard
                        title="Job Applications"
                        value={stats.jobApplications.total}
                        subtitle={`${stats.jobApplications.shortlisted} shortlisted`}
                        icon={FileText}
                        href="/applications"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Quick Actions (Now using a responsive sub-grid) */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Quick Start
                        </h2>
                        
                        {/* FIX: Use responsive grid for ActionCards for better alignment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <ActionCard
                                title="Aptitude Practice"
                                description="Sharpen your quantitative and logical reasoning skills"
                                href="/practice/aptitude"
                                icon={BrainCircuit}
                            />
                            
                            <ActionCard
                                title="Coding Practice"
                                description="Solve algorithmic problems and improve your coding"
                                href="/practice/coding"
                                icon={Code}
                            />
                            
                            <ActionCard
                                title="AI Mock Interview"
                                description="Practice interviews with AI-powered feedback"
                                href="/practice/interview"
                                icon={User}
                                badge="New"
                            />
                            
                            <ActionCard
                                title="Resume Builder"
                                description="Create and optimize your ATS-friendly resume"
                                href="/resume-builder"
                                icon={FileText}
                            />
                        </div>
                    </div>

                    {/* Performance & Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Top Performance */}
                        <div className="rounded-xl border bg-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-primary" />
                                    Your Strengths
                                </h2>
                                <Link
                                    href="/analytics"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    View All
                                </Link>
                            </div>

                            {stats.performance.topSkills.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.performance.topSkills.slice(0, 5).map((skill, index) => (
                                        <PerformanceBar
                                            key={index}
                                            name={skill.name}
                                            score={skill.averageScore}
                                            accuracy={skill.accuracy}
                                            category={skill.category}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground mb-4">
                                        Complete practice tests to see your performance
                                    </p>
                                    <Link
                                        href="/practice"
                                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Start Practicing
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Recent Machine Tests */}
                        {stats.machineTests.history.length > 0 && (
                            <div className="rounded-xl border bg-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        Recent Coding Tests
                                    </h2>
                                    <Link
                                        href="/practice/coding/history"
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        View All
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    {stats.machineTests.history.slice(0, 5).map((test) => (
                                        <div
                                            key={test.id}
                                            className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    test.problemsPassed === test.problemsCount
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : 'bg-muted'
                                                }`}>
                                                    <Code className={`w-5 h-5 ${
                                                        test.problemsPassed === test.problemsCount
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-muted-foreground'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {test.difficulty} Difficulty Test
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDistanceToNow(new Date(test.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="font-semibold text-foreground">
                                                    {test.problemsPassed}/{test.problemsCount}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    problems solved
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Improvement Areas */}
                        {stats.performance.improvementAreas.length > 0 && (
                            <div className="rounded-xl border bg-card p-6">
                                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    Areas for Improvement
                                </h2>
                                <div className="space-y-3">
                                    {stats.performance.improvementAreas.slice(0, 3).map((area, index) => (
                                        <PerformanceBar
                                            key={index}
                                            name={area.name}
                                            score={area.averageScore}
                                            accuracy={area.accuracy}
                                            category={area.category}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resume Upload CTA */}
                {!stats.profile.hasResume && (
                    <Link href="/profile">
                        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground mb-1">
                                            Upload Your Resume
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Add your resume to start applying for opportunities
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}

export default memo(StudentDashboard);
