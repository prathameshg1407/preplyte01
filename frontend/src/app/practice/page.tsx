// src/app/practice/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Code,
  Bot,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

const practiceAreas = [
  {
    title: 'Aptitude Practice',
    description:
      'Sharpen your quantitative, logical, and verbal skills with our dynamic quizzes.',
    href: '/practice/aptitude',
    icon: BrainCircuit,
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconTextColor: 'text-blue-600 dark:text-blue-400',
    disabled: false,
  },
  {
    title: 'Coding Challenges',
    description:
      'Solve real-world coding problems and improve your data structures & algorithms knowledge.',
    href: '/practice/machine-test',
    icon: Code,
    iconBgColor: 'bg-green-100 dark:bg-green-900/30',
    iconTextColor: 'text-green-600 dark:text-green-400',
    disabled: false,
  },
  {
    title: 'AI Interview',
    description:
      'Practice your interview skills with an AI-powered mock interviewer that gives instant feedback.',
    // ✅ FIX: Updated the href to point to the new AI interview page.
    href: '/practice/ai-interview',
    icon: Bot,
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconTextColor: 'text-purple-600 dark:text-purple-400',
    disabled: false,
  },
  {
    title: 'Mock Drive',
    description:
      'Simulate a full placement drive experience, from aptitude tests to technical interviews.',
    href: '#',
    icon: Briefcase,
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconTextColor: 'text-orange-600 dark:text-orange-400',
    disabled: true,
  },
];

export default function PracticePage() {
  return (
    <main className="container mx-auto max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 animate-fade-in-down">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Practice Center
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Select an area to focus on and start preparing for success.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 animate-fade-in-up">
        {practiceAreas.map((area) => {
          const CardContent = (
            <>
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-lg inline-flex transition-transform duration-300 group-hover:scale-110 ${area.iconBgColor}`}
                >
                  <area.icon
                    className={`h-8 w-8 ${area.iconTextColor}`}
                    aria-hidden="true"
                  />
                </div>
                {!area.disabled && (
                  <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300" />
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-foreground">
                  {area.title}
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  {area.description}
                </p>
              </div>
              {area.disabled && (
                <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Coming Soon
                </div>
              )}
            </>
          );

          if (area.disabled) {
            return (
              <div
                key={area.title}
                className="relative bg-card p-6 rounded-xl border border-border shadow-md cursor-not-allowed opacity-60"
              >
                {CardContent}
              </div>
            );
          }

          return (
            <Link
              href={area.href}
              key={area.title}
              className="group relative block bg-card p-6 rounded-xl border border-border shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary hover:scale-[1.02] active:scale-100"
            >
              {CardContent}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
