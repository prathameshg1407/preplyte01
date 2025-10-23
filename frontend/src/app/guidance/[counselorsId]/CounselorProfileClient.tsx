// app/guidance/[counselorsId]/CounselorProfileClient.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
    Star, 
    Award, 
    Briefcase, 
    Clock, 
    MapPin,
    Heart,
    BookOpen,
    Mail,
    Phone,
    ArrowLeft,
    Calendar,
    Users,
    CheckCircle,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Counselor {
    id: number;
    name: string;
    image: string;
    designation: string;
    experience: number;
    rating: number;
    reviews: number;
    specializations: string[];
    price: number;
    sessions: number;
    location: string;
    availability: string;
    verified: boolean;
    shortBio: string;
    fullBio: string;
    contact: { email: string; phone: string };
    education: string[];
    achievements: string[];
}

interface CounselorProfileClientProps {
    counselor: Counselor;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

export default function CounselorProfileClient({ counselor }: CounselorProfileClientProps) {
    const [imageError, setImageError] = useState(false); 

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-[0.02]"></div>
                
                <div className="container relative mx-auto px-4 py-12 sm:py-16">
                    {/* Breadcrumbs */}
                    <nav className="mb-8">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" className="p-0 hover:bg-transparent" asChild>
                                <Link href="/guidance" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Counselors
                                </Link>
                            </Button>
                            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <li>Home</li>
                                <li className="text-muted-foreground/50">/</li>
                                <li>Guidance</li>
                                <li className="text-muted-foreground/50">/</li>
                                <li className="font-medium text-foreground">{counselor.name}</li>
                            </ol>
                        </div>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Profile Summary & Booking */}
                        <aside className="lg:col-span-1">
                            <Card className="sticky top-24 overflow-hidden">
                                <CardContent className="p-8">
                                    {/* Profile Image */}
                                    <div className="relative mx-auto w-32 h-32 mb-6">
                                        <div className="relative h-full w-full rounded-full border-4 border-primary/20 overflow-hidden">
                                            {!imageError ? (
                                                <Image
                                                    src={counselor.image}
                                                    alt={counselor.name}
                                                    fill
                                                    className="object-cover"
                                                    onError={() => setImageError(true)}
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl font-bold text-white">
                                                    {getInitials(counselor.name)}
                                                </div>
                                            )}
                                        </div>
                                        {counselor.verified && (
                                            <div className="absolute bottom-0 right-0 bg-success p-1.5 rounded-full border-4 border-card">
                                                <CheckCircle className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name and Title */}
                                    <div className="text-center mb-6">
                                        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                                            {counselor.name}
                                        </h1>
                                        <p className="text-sm text-primary font-medium">
                                            {counselor.designation}
                                        </p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                                            <div className="flex items-center justify-center text-warning mb-1">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span className="font-bold ml-1">{counselor.rating}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{counselor.reviews} Reviews</p>
                                        </div>
                                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                                            <p className="font-bold text-foreground">{counselor.experience}+</p>
                                            <p className="text-xs text-muted-foreground">Years Exp</p>
                                        </div>
                                        <div className="text-center p-3 bg-secondary/50 rounded-lg">
                                            <p className="font-bold text-foreground">{Math.floor(counselor.sessions / 100) * 100}+</p>
                                            <p className="text-xs text-muted-foreground">Sessions</p>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />
                                    
                                    {/* Pricing Section */}
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <p className="text-3xl font-display font-bold text-primary">
                                                ₹{counselor.price}
                                            </p>
                                            <p className="text-sm text-muted-foreground">per session (30 mins)</p>
                                        </div>
                                        
                                        <Button className="w-full" size="lg">
                                            Book Personalized Session
                                        </Button>
                                        
                                        <Button variant="outline" className="w-full" size="lg">
                                            <Heart className="w-4 h-4 mr-2" />
                                            Add to Favorites
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>

                        {/* Main Content */}
                        <main className="lg:col-span-2 space-y-6">
                            {/* About Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center font-display">
                                        <BookOpen className="w-5 h-5 mr-2 text-primary" />
                                        About {counselor.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        {counselor.fullBio}
                                    </p>
                                    <div className="space-y-3 mt-4">
                                        <div className="flex items-center text-sm">
                                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                                            <span className="font-medium">Location:</span>
                                            <span className="ml-2 text-muted-foreground">{counselor.location}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <Clock className="h-4 w-4 mr-2 text-success" />
                                            <span className="font-medium">Availability:</span>
                                            <Badge variant="secondary" className="ml-2">
                                                {counselor.availability}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Specializations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center font-display">
                                        <Award className="w-5 h-5 mr-2 text-primary" />
                                        Areas of Expertise
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {counselor.specializations.map((spec, i) => (
                                            <Badge key={i} variant="secondary" className="px-3 py-1">
                                                {spec}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Qualifications Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Education */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center font-display text-lg">
                                            <Globe className="w-5 h-5 mr-2 text-primary" />
                                            Education
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {counselor.education.map((edu, i) => (
                                                <li key={i} className="flex items-start">
                                                    <CheckCircle className="w-4 h-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-muted-foreground">{edu}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Achievements */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center font-display text-lg">
                                            <Award className="w-5 h-5 mr-2 text-primary" />
                                            Achievements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {counselor.achievements.map((ach, i) => (
                                                <li key={i} className="flex items-start">
                                                    <CheckCircle className="w-4 h-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-muted-foreground">{ach}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contact Information */}
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center font-display">
                                        <Mail className="w-5 h-5 mr-2 text-primary" />
                                        Get in Touch
                                    </CardTitle>
                                    <CardDescription>
                                        Connect with {counselor.name} for personalized guidance
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Button variant="outline" className="flex-1" asChild>
                                            <a href={`mailto:${counselor.contact.email}`}>
                                                <Mail className="h-4 w-4 mr-2" />
                                                {counselor.contact.email}
                                            </a>
                                        </Button>
                                        <Button variant="outline" className="flex-1" asChild>
                                            <a href={`tel:${counselor.contact.phone}`}>
                                                <Phone className="h-4 w-4 mr-2" />
                                                {counselor.contact.phone}
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}