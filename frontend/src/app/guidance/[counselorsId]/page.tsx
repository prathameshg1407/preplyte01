// app/guidance/[counselorsId]/page.tsx (This is a Server Component)

import CounselorProfileClient from './CounselorProfileClient';
import { notFound } from 'next/navigation';

// --- Mock Data (Defined here for server-side functions) ---
const counselors = [
    {
        id: 1,
        name: "Dr. Priya Sharma",
        image: "/counselors/priya.jpg",
        designation: "Career Strategist & Educational Psychologist",
        experience: 12,
        rating: 4.9,
        reviews: 248,
        specializations: ["Engineering Careers", "Career Transitions", "Study Abroad", "Aptitude Testing", "Post-Graduate Planning"],
        price: 1499,
        sessions: 1200,
        location: "Delhi, India",
        availability: "Available Today",
        verified: true,
        shortBio: "PhD in Educational Psychology with expertise in helping students make informed career choices based on aptitude and market trends.",
        fullBio: "Dr. Priya Sharma is a highly sought-after career strategist with 12 years of experience. Her approach integrates educational psychology principles with practical market insights. She is specialized in guiding students through the complex landscapes of engineering admissions and study abroad applications, boasting a 95% success rate in placing students in their top-choice universities. She is also an expert in career transition counseling for young professionals.",
        contact: {
            email: "priya.sharma@example.com",
            phone: "+91 98765 43210"
        },
        education: ["PhD in Educational Psychology (Delhi University)", "M.A. Counseling (IGNOU)"],
        achievements: ["Top 10 Career Counselor in India (2023)", "1000+ Students Mentored into IITs/NITs"]
    },
    {
        id: 2,
        name: "Rajiv Mehta",
        image: "/counselors/rajiv.jpg",
        designation: "Industry Expert & College Admission Counselor",
        experience: 8,
        rating: 4.7,
        reviews: 187,
        specializations: ["IIT/NIT Admissions", "Medical Careers", "Scholarships", "JEE/NEET Strategy", "Finance Careers"],
        price: 1299,
        sessions: 950,
        location: "Mumbai, India",
        availability: "Available Tomorrow",
        verified: true,
        shortBio: "Former IIT professor who has guided 1000+ students into premier institutions across India and abroad.",
        fullBio: "Rajiv Mehta brings a decade of direct experience from the academic and industrial sectors. As a former professor, he offers unparalleled insight into the admission criteria and academic rigor required for top engineering and medical colleges. He is particularly effective in helping students secure highly competitive scholarships and financial aid.",
        contact: {
            email: "rajiv.mehta@example.com",
            phone: "+91 98765 43211"
        },
        education: ["M.Tech Computer Science (IIT Bombay)", "B.Tech Electronics (NIT Warangal)"],
        achievements: ["Former Visiting Faculty at IIT Kanpur", "Author of 'The JEE Success Blueprint'"]
    },
    // ... include the rest of your counselor data here
    {
        id: 3,
        name: "Ananya Gupta",
        image: "/counselors/ananya.jpg",
        designation: "Study Abroad Expert & Placement Specialist",
        experience: 7,
        rating: 4.8,
        reviews: 156,
        specializations: ["USA/UK Admissions", "SOP Guidance", "Interview Prep", "Visa Consulting", "Scholarships"],
        price: 1399,
        sessions: 820,
        location: "Bangalore, India",
        availability: "Available Today",
        verified: true,
        shortBio: "Specialized in helping students secure admissions and scholarships at Ivy League and Russell Group universities.",
        fullBio: "Ananya Gupta is the go-to expert for international education. She has a deep understanding of the admission processes for top universities in North America and Europe. Her strength lies in crafting compelling SOPs and excelling in mock interviews, ensuring students present their best selves to admission committees.",
        contact: {
            email: "ananya.gupta@example.com",
            phone: "+91 98765 43212"
        },
        education: ["M.A. International Relations (London School of Economics)", "B.A. English Hons (St. Stephen's College)"],
        achievements: ["Ivy League Admission Specialist", "Certified Global Career Counsellor"]
    },
    {
        id: 4,
        name: "Vikram Singh",
        image: "/counselors/vikram.jpg",
        designation: "Career Assessment Expert & Motivational Coach",
        experience: 15,
        rating: 4.9,
        reviews: 320,
        specializations: ["Psychometric Testing", "Skill Development", "Career Planning", "Mindfulness", "Leadership Coaching"],
        price: 1599,
        sessions: 1500,
        location: "Hyderabad, India",
        availability: "Available in 2 days",
        verified: true,
        shortBio: "Combines psychometric assessments with personalized mentoring to help students discover their ideal career path.",
        fullBio: "With 15 years in the field, Vikram Singh is a veteran counselor who believes in a holistic approach. He utilizes advanced psychometric tools to accurately gauge a student's aptitude and personality, providing a scientific basis for career decisions. His coaching focuses on motivation and long-term career resilience.",
        contact: {
            email: "vikram.singh@example.com",
            phone: "+91 98765 43213"
        },
        education: ["M.Sc. Applied Psychology (University of Madras)", "Certified Career Analyst"],
        achievements: ["Pioneer in Online Psychometric Counseling", "Best Mentor Award (2022)"]
    }
];

// 🛑 1. generateStaticParams lives here (Server/Build time) 🛑
export async function generateStaticParams() {
    return counselors.map((counselor) => ({
        counselorsId: counselor.id.toString(), 
    }));
}

// Define the structure for the props (optional but good practice)
interface CounselorProfilePageProps {
  params: {
    counselorsId: string;
  };
}

// 🛑 2. Main Page Component (Server Component) 🛑
export default function CounselorProfilePage({ params }: CounselorProfilePageProps) {
    const counselorId = parseInt(params.counselorsId);
    
    // Find the counselor data on the server
    const counselor = counselors.find(c => c.id === counselorId);
    
    // Server-side check for 404
    if (!counselor) {
        // Next.js equivalent of a 404 page
        notFound(); 
    }

    // Pass the fetched data down to the client component
    // The client component handles the rendering and client-side logic (useState, etc.)
    return (
        <CounselorProfileClient counselor={counselor} />
    );
}