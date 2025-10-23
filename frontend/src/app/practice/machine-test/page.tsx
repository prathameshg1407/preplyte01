'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wand2, LogIn } from 'lucide-react';

import { generateMachineTest } from '@/lib/api/machine-test.client';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { QuestionDifficulty } from '@/types/enum';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

/**
 * A reusable card component to prompt unauthenticated users to log in.
 */
function LoginPromptCard() {
  const { openAuthModal } = useUI();
  return (
    <Card className="w-full max-w-lg mx-auto text-center">
      <CardHeader>
        <LogIn className="mx-auto h-12 w-12 text-muted-foreground" />
        <CardTitle className="mt-4">Login Required</CardTitle>
        <CardDescription>You need to be logged in to start a machine test.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" onClick={openAuthModal}>
          <LogIn className="mr-2 h-4 w-4" /> Login or Sign Up
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function MachineTestSetupPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(QuestionDifficulty.EASY);
  const [count, setCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- THIS IS THE FIX ---
  // The function is refactored for a cleaner success/error flow.
  const handleStartTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const testData = await generateMachineTest({ difficulty, count });
      // On success, the redirect happens and the component unmounts.
      // No need to set isLoading to false.
      router.push(`/practice/machine-test/${testData.id}`);
    } catch (err) {
      // On error, the user stays on the page.
      // We show an error message and stop the loading spinner.
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <main className="container mx-auto flex max-w-2xl flex-col items-center justify-center py-24 px-4">
      <div className="mb-8 text-center">
        <Wand2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl font-extrabold text-foreground">
          Machine Test Setup
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Configure your coding test and get ready to solve.
        </p>
      </div>
      
      {!isAuthenticated ? (
        <LoginPromptCard />
      ) : (
        <Card className="w-full">
            <CardContent className="p-8">
                <div className="space-y-6">
                <div className="grid w-full items-center gap-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={(value: QuestionDifficulty) => setDifficulty(value)}>
                        <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={QuestionDifficulty.EASY}>Easy</SelectItem>
                            <SelectItem value={QuestionDifficulty.MEDIUM}>Medium</SelectItem>
                            <SelectItem value={QuestionDifficulty.HARD}>Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid w-full items-center gap-2">
                    <Label htmlFor="count">Number of Questions</Label>
                     <Select value={String(count)} onValueChange={(value) => setCount(parseInt(value))}>
                        <SelectTrigger id="count">
                            <SelectValue placeholder="Select number of questions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="3">3 Questions</SelectItem>
                            <SelectItem value="5">5 Questions</SelectItem>
                            <SelectItem value="7">7 Questions</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                </div>

                {error && (
                <p className="mt-4 text-center text-sm text-destructive">{error}</p>
                )}

            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleStartTest}
                    disabled={isLoading}
                    className="w-full text-lg py-6"
                >
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Start Test'}
                </Button>
            </CardFooter>
        </Card>
      )}
    </main>
  );
}