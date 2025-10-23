'use client';

import {
  Users,
  BookOpen,
  Code,
  Bot,
  ArrowRight,
  UserPlus,
  ClipboardList,
  Sparkles,
  Star,
  Loader2,
  Briefcase,
  TrendingUp,
  FileText,
  GraduationCap,
  Target,
  Zap,
  CheckCircle2,
  Building2,
  Trophy,
  Lightbulb,
  Brain,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import AppLayout from '@/components/AppLayout';
import { Button, ButtonProps } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Data Constants ---

const stats = [
  { value: '15K+', label: 'Active Students' },
  { value: '500+', label: 'Job Listings' },
  { value: '50+', label: 'Partner Institutions' },
  { value: '95%', label: 'Success Rate' },
];

const mainFeatures = [
  {
    icon: <TrendingUp className="w-12 h-12 text-primary" />,
    title: 'Personalized Career Path',
    description: 'AI-powered career guidance tailored to your skills, interests, and goals. Get a roadmap to your dream job.',
    href: '/guidance',
    badge: 'Popular',
  },
  {
    icon: <Bot className="w-12 h-12 text-primary" />,
    title: 'AI Mock Interviews',
    description: 'Practice with our AI interviewer. Get real-time feedback on technical and behavioral questions.',
    href: '/practice/ai-interview',
    badge: 'AI Powered',
  },
  {
    icon: <Briefcase className="w-12 h-12 text-primary" />,
    title: 'Live Job Listings',
    description: 'Access exclusive internships, jobs, and hackathons from top companies. Apply directly through our platform.',
    href: '/events/jobs',
    badge: 'New',
  },
];

const comprehensiveFeatures = [
  {
    icon: <FileText className="w-8 h-8" />,
    title: 'ATS Resume Builder',
    description: 'Create ATS-friendly resumes and check compatibility with job descriptions.',
    href: '/resume-builder',
  },
  {
    icon: <Code className="w-8 h-8" />,
    title: 'Coding Challenges',
    description: 'Solve real-world problems in a timed environment with instant feedback.',
    href: '/practice/machine-test',
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Aptitude Practice',
    description: 'Master quantitative, logical, and verbal reasoning with 1000+ questions.',
    href: '/practice/aptitude',
  },
  {
    icon: <GraduationCap className="w-8 h-8" />,
    title: 'Learning Courses',
    description: 'Structured courses to upskill in trending technologies and domains.',
    href: '/lms',
  },
  {
    icon: <Building2 className="w-8 h-8" />,
    title: 'College Finder',
    description: 'Discover and compare colleges based on placements, ratings, and more.',
    href: '/find-colleges',
  },
  {
    icon: <ClipboardList className="w-8 h-8" />,
    title: 'Mock Placement Drives',
    description: 'Participate in full-length mock drives organized by your institution.',
    href: '/mock-drives',
  },
];

const careerJourneySteps = [
  {
    icon: <Target className="w-10 h-10 text-primary" />,
    title: 'Discover Your Path',
    description: 'Take career assessments and get personalized recommendations based on your profile.',
  },
  {
    icon: <Brain className="w-10 h-10 text-primary" />,
    title: 'Skill Up & Practice',
    description: 'Access curated courses, practice questions, and coding challenges to build expertise.',
  },
  {
    icon: <Bot className="w-10 h-10 text-primary" />,
    title: 'Master Interviews',
    description: 'Practice with AI interviews, get detailed feedback, and improve your communication.',
  },
  {
    icon: <Rocket className="w-10 h-10 text-primary" />,
    title: 'Land Your Dream Job',
    description: 'Apply to exclusive opportunities and track your applications in one place.',
  },
];

const testimonials = [
  {
    quote: "The AI interview feature helped me identify my weak points. I practiced and aced my Google interview!",
    name: "Anjali Sharma",
    title: "SDE @ Google",
    rating: 5,
    image: "AS",
  },
  {
    quote: "Found my dream internship through Preplyte's job listings. The resume builder made my profile stand out!",
    name: "Rohan Verma",
    title: "ML Intern @ Microsoft",
    rating: 5,
    image: "RV",
  },
  {
    quote: "As a TPO, Preplyte has streamlined our placement process. The analytics help us track student progress effectively.",
    name: "Dr. Priya Deshmukh",
    title: "TPO, IIT Delhi",
    rating: 5,
    image: "PD",
  },
  {
    quote: "The career path guidance was a game-changer. I had no idea which domain to choose, but the AI assessment helped me find my passion in data science.",
    name: "Karthik Reddy",
    title: "Data Analyst @ Amazon",
    rating: 5,
    image: "KR",
  },
];

const benefits = [
  'Practice with real interview questions',
  'Get instant AI-powered feedback',
  'Access 500+ job & internship listings',
  'Build ATS-optimized resumes',
  'Track your progress with analytics',
  'Join exclusive campus drives',
];

// --- Reusable Components ---

interface AuthActionButtonProps extends ButtonProps {
  authenticatedText?: string;
  unauthenticatedText?: string;
  className?: string;
}

const AuthActionButton = ({
  authenticatedText = "Go to Dashboard",
  unauthenticatedText = "Get Started For Free",
  className = "",
  ...props
}: AuthActionButtonProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { openAuthModal } = useUI();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <Button size="lg" disabled className={className}>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button asChild size="lg" className={`${className} transition-transform hover:scale-105 group`} {...props}>
        <Link href="/dashboard">
          {authenticatedText}
          <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    );
  }

  return (
    <Button onClick={openAuthModal} size="lg" className={`${className} transition-transform hover:scale-105 group`} {...props}>
      {unauthenticatedText}
      <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
    </Button>
  );
};

// --- Main Home Page Component ---

export default function HomePage() {
  return (
    <AppLayout>
      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>

          <div className="relative container mx-auto px-4 flex flex-col items-center justify-center text-center py-20 md:py-32">
            <div className="max-w-5xl">
              {/* Badge */}
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Trusted by 15,000+ students from top institutions
              </Badge>

              {/* Main Heading */}
              <h1 className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                Your Complete Career
                <br />
                <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Success Platform
                </span>
              </h1>

              {/* Subheading */}
              <p className="font-sans mt-8 text-xl md:text-2xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                AI-powered career guidance, mock interviews, job listings, and placement prep — 
                all in one place. Your journey from student to professional starts here.
              </p>

              {/* CTA Buttons */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
                <AuthActionButton className="w-full sm:w-auto px-8 py-6 text-lg" />
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg border-2">
                  <Link href="#features">
                    <Lightbulb className="mr-2 w-5 h-5" />
                    Explore Features
                  </Link>
                </Button>
              </div>

              {/* Benefits List */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                {['No Credit Card Required', 'Free Forever Plan', '24/7 AI Support'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                  <div className="text-primary-foreground/80 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Features Section (3 Big Cards) */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Core Features</Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                From career discovery to job placement, we've got you covered at every step.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {mainFeatures.map((feature, index) => (
                <Link key={index} href={feature.href}>
                  <div className="relative group bg-card p-10 rounded-2xl shadow-lg border-2 border-transparent hover:border-primary hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full cursor-pointer">
                    {feature.badge && (
                      <Badge className="absolute top-4 right-4" variant="secondary">
                        {feature.badge}
                      </Badge>
                    )}
                    
                    <div className="mb-6 bg-primary/10 p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-2xl font-heading font-bold text-card-foreground mb-4">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-base leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    <div className="flex items-center text-primary font-semibold group-hover:gap-3 gap-2 transition-all">
                      Explore <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Comprehensive Features Grid */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                Complete Placement Preparation Suite
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Access all the tools and resources you need to prepare, practice, and succeed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comprehensiveFeatures.map((feature, index) => (
                <Link key={index} href={feature.href}>
                  <div className="bg-card p-6 rounded-xl shadow-md border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group">
                    <div className="mb-4 text-primary group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-heading font-bold text-card-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Career Journey Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Your Journey</Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                Your Path to Career Success
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A structured, proven approach to land your dream job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 z-0"></div>
              
              {careerJourneySteps.map((step, index) => (
                <div key={index} className="relative z-10 flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-6 rounded-full border-4 border-background shadow-lg mb-6 relative">
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <Badge variant="outline" className="mb-4">Why Choose Us</Badge>
                <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                  Built for Students, Loved by Professionals
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of students who transformed their careers with Preplyte. 
                  Our platform combines cutting-edge AI with real-world placement expertise.
                </p>
                
                <div className="space-y-4 mb-8">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-base">{benefit}</span>
                    </div>
                  ))}
                </div>

                <AuthActionButton />
              </div>

              <div className="relative">
                <div className="bg-card p-8 rounded-2xl shadow-2xl border-2 border-primary/20">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                      <Trophy className="w-10 h-10 text-primary" />
                      <div>
                        <div className="font-bold text-lg">10,000+</div>
                        <div className="text-sm text-muted-foreground">Students Placed</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                      <Zap className="w-10 h-10 text-primary" />
                      <div>
                        <div className="font-bold text-lg">50,000+</div>
                        <div className="text-sm text-muted-foreground">Mock Interviews Conducted</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                      <Briefcase className="w-10 h-10 text-primary" />
                      <div>
                        <div className="font-bold text-lg">500+</div>
                        <div className="text-sm text-muted-foreground">Active Job Listings</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Success Stories</Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">
                Loved by Students & Educators
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Don't just take our word for it. Hear from those who achieved their dreams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-card p-6 rounded-xl shadow-md border hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Rating */}
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-muted-foreground text-sm mb-6 flex-grow italic">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                      {testimonial.image}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Institutions Section */}
        <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Users className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
                For Institutions & TPOs
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Streamline your campus placements with our comprehensive admin dashboard. 
                Manage mock drives, track student progress, and boost placement rates.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-card p-6 rounded-lg">
                  <ClipboardList className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Organize Mock Drives</h3>
                  <p className="text-sm text-muted-foreground">Create and manage campus-wide placement drives</p>
                </div>
                <div className="bg-card p-6 rounded-lg">
                  <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Track Analytics</h3>
                  <p className="text-sm text-muted-foreground">Monitor student performance with detailed insights</p>
                </div>
                <div className="bg-card p-6 rounded-lg">
                  <Building2 className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Batch Management</h3>
                  <p className="text-sm text-muted-foreground">Efficiently manage student batches and cohorts</p>
                </div>
              </div>

              <Button asChild size="lg" variant="outline" className="border-2">
                <Link href="/admin/dashboard">
                  Request Institution Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 border-4 border-white rounded-full"></div>
              </div>

              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold font-heading mb-6">
                  Ready to Launch Your Career?
                </h2>
                <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-10 leading-relaxed">
                  Join 15,000+ students who are already preparing for success. 
                  Start your journey today — completely free.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <AuthActionButton
                    variant="secondary"
                    className="shadow-xl"
                    authenticatedText="Go to Dashboard"
                    unauthenticatedText="Start Free Today"
                  />
                  <Button asChild variant="outline" size="lg" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary">
                    <Link href="/events/jobs">
                      Browse Jobs
                      <Briefcase className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-primary-foreground/80">
                  ✨ No credit card required • Free forever plan available
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA Strip */}
        <section className="py-6 bg-secondary/30 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div>
                <p className="font-semibold text-lg">🚀 New: AI Career Path Assessment</p>
                <p className="text-sm text-muted-foreground">Discover your ideal career in 5 minutes</p>
              </div>
              <Button asChild variant="default">
                <Link href="/guidance">
                  Take Assessment
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}