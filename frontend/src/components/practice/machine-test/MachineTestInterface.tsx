'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Clock,
  Save,
  RotateCcw,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Moon,
  Sun,
  Code2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { MachineTest, MachineTestProblem } from '@/types';
import { submitMachineTestCode } from '@/lib/api/machine-test.client';
import LoadingSpinner from '@/components/LoadingSpinner';

// --- TYPE DEFINITIONS ---

interface LanguageConfig {
  name: string;
  editorLang: string;
  id: number;
  boilerplate: string;
}
type LanguageId = 71 | 63 | 62 | 54;

interface SubmissionResultData {
  finalStatus: string;
  score: number;
  passedCount: number;
  totalCases: number;
  results: Array<{
    status: string;
    input: string;
    output: string | null;
    expected: string | null;
    error: string | null;
  }>;
  error?: string;
}

interface ProblemResult {
  status: 'idle' | 'running' | 'success' | 'error';
  data?: SubmissionResultData;
}

interface ProblemStatus {
  attempted: boolean;
  passed: boolean;
  score: number;
}

// Extended type for problem with points
interface ExtendedProblem {
  problem: MachineTestProblem;
  points?: number;
}

// --- CONSTANTS ---

const languageMap: Record<LanguageId, LanguageConfig> = {
  71: { name: 'Python', editorLang: 'python', id: 71, boilerplate: `def solve():\n\t# Your code here\n\tprint("Hello, World!")\n\nsolve()` },
  63: { name: 'JavaScript', editorLang: 'javascript', id: 63, boilerplate: `function solve() {\n\t// Your code here\n\tconsole.log("Hello, World!");\n}\n\nsolve();` },
  62: { name: 'Java', editorLang: 'java', id: 62, boilerplate: `public class Main {\n\tpublic static void main(String[] args) {\n\t\t// Your code here\n\t\tSystem.out.println("Hello, World!");\n\t}\n}` },
  54: { name: 'C++', editorLang: 'cpp', id: 54, boilerplate: `#include <iostream>\n\nint main() {\n\t// Your code here\n\tstd::cout << "Hello, World!" << std::endl;\n\treturn 0;\n}` },
};

// --- SUB-COMPONENTS ---

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
  <div className="group relative inline-block">
    {children}
    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const Timer = ({ endTime }: { endTime?: Date | string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft('--:--:--');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('Time Up!');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      setIsWarning(distance < 10 * 60 * 1000); // Warning in last 10 minutes
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono font-semibold ${isWarning ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
      <Clock size={16} className={isWarning ? 'animate-pulse' : ''} />
      <span>{timeLeft}</span>
    </div>
  );
};

const AutoSaveIndicator = ({ isSaving, lastSaved }: { isSaving: boolean; lastSaved: Date | null }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Save size={14} className={isSaving ? 'animate-pulse' : ''} />
    <span>
      {isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
    </span>
  </div>
);

const ProblemSidebar = ({ 
  problems, 
  activeProblemIndex, 
  onSelectProblem,
  problemStatuses,
  isOpen,
  onClose
}: { 
  problems: ExtendedProblem[];
  activeProblemIndex: number;
  onSelectProblem: (index: number) => void;
  problemStatuses: Record<number, ProblemStatus>;
  isOpen: boolean;
  onClose: () => void;
}) => (
  <>
    {/* Mobile overlay */}
    {isOpen && (
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
    )}
    
    <div className={`
      fixed lg:static inset-y-0 left-0 z-50
      w-64 bg-card border-r border-border
      transform transition-transform duration-200 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Problems</h2>
        <button onClick={onClose} className="lg:hidden">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-4rem)]">
        {problems.map((p, idx) => {
          const status = problemStatuses[p.problem.id];
          const points = p.points ?? 100; // Default points if not specified
          
          return (
            <button
              key={p.problem.id}
              onClick={() => {
                onSelectProblem(idx);
                onClose();
              }}
              className={`
                w-full p-4 text-left border-b border-border
                hover:bg-accent/50 transition-colors
                ${activeProblemIndex === idx ? 'bg-accent border-l-4 border-l-primary' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {idx + 1}. {p.problem.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{points} points</span>
                    {status?.attempted && (
                      <span className={`flex items-center gap-1 ${status.passed ? 'text-green-500' : 'text-orange-500'}`}>
                        {status.passed ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                        {status.score > 0 && `${status.score}%`}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`
                  w-2 h-2 rounded-full mt-1 flex-shrink-0
                  ${status?.passed ? 'bg-green-500' : status?.attempted ? 'bg-orange-500' : 'bg-muted'}
                `} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </>
);

const ProblemDescription = ({ problem }: { problem: MachineTestProblem }) => {
  const { problemStatement, inputFormat, outputFormat, constraints } = (problem.description as any) || {};

  return (
    <div className="p-6 h-full overflow-y-auto bg-card text-card-foreground">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        <span className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium whitespace-nowrap">
          {problem.difficulty || 'Medium'}
        </span>
      </div>
      
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        {problemStatement && (
          <div>
            <h3 className="font-semibold text-base mb-2">Problem Statement</h3>
            <p className="text-muted-foreground leading-relaxed">{problemStatement}</p>
          </div>
        )}
        
        {inputFormat && (
          <div>
            <h3 className="font-semibold text-base mb-2">Input Format</h3>
            <p className="text-muted-foreground leading-relaxed">{inputFormat}</p>
          </div>
        )}

        {outputFormat && (
          <div>
            <h3 className="font-semibold text-base mb-2">Output Format</h3>
            <p className="text-muted-foreground leading-relaxed">{outputFormat}</p>
          </div>
        )}

        {constraints && constraints.length > 0 && (
          <div>
            <h3 className="font-semibold text-base mb-2">Constraints</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {constraints.map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        
        {problem.testCases?.sample && problem.testCases.sample.length > 0 && (
          <div>
            <h3 className="font-semibold text-base mb-2 mt-6">Sample Test Cases</h3>
            {problem.testCases.sample.map((tc: { input: string; output: string }, i: number) => (
              <div key={i} className="mb-4 rounded-lg border border-border p-4 bg-secondary/30">
                <p className="font-semibold text-sm mb-2">Example {i+1}</p>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">Input:</p>
                    <pre className="p-3 rounded-md bg-background border border-border whitespace-pre-wrap">{tc.input}</pre>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">Output:</p>
                    <pre className="p-3 rounded-md bg-background border border-border whitespace-pre-wrap">{tc.output}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TestOutputPanel = ({ result }: { result?: ProblemResult }) => {
  if (result?.status === 'running') {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Evaluating your code..." />
      </div>
    );
  }

  if (result?.status === 'error') {
    return (
      <div className="p-6">
        <div className="rounded-lg border-2 border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-500 mb-2">Error Occurred</h3>
              <p className="text-sm text-red-400">{result.data?.error || 'An unknown error happened.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (result?.status === 'success' && result.data) {
    const { passedCount, totalCases, results } = result.data;
    const allPassed = passedCount === totalCases;
    
    return (
      <div className="p-6 text-sm">
        <div className={`mb-6 p-4 rounded-lg border-2 ${allPassed ? 'border-green-500/50 bg-green-500/10' : 'border-orange-500/50 bg-orange-500/10'}`}>
          <div className="flex items-center gap-3">
            {allPassed ? (
              <CheckCircle size={24} className="text-green-500" />
            ) : (
              <AlertTriangle size={24} className="text-orange-500" />
            )}
            <div>
              <h3 className={`text-lg font-bold ${allPassed ? 'text-green-500' : 'text-orange-500'}`}>
                {allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {passedCount} out of {totalCases} test cases passed
              </p>
            </div>
          </div>
          {!allPassed && (
            <div className="mt-3 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${(passedCount / totalCases) * 100}%` }}
              />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {results.map((res, index) => (
            <div 
              key={index} 
              className={`rounded-lg border-2 p-4 ${res.status === 'Accepted' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {res.status === 'Accepted' ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <XCircle size={18} className="text-red-500" />
                )}
                <span className="font-semibold">Test Case #{index + 1}</span>
                <span className={`ml-auto text-xs px-2 py-1 rounded ${res.status === 'Accepted' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {res.status}
                </span>
              </div>
              
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <p className="font-semibold text-muted-foreground mb-1.5">Input:</p>
                  <pre className="p-3 rounded-md bg-background border border-border whitespace-pre-wrap">{res.input}</pre>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground mb-1.5">Your Output:</p>
                  <pre className={`p-3 rounded-md border whitespace-pre-wrap ${res.status === 'Accepted' ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                    {res.output || (res.error ? `Error: ${res.error}` : 'No output')}
                  </pre>
                </div>
                {res.status !== 'Accepted' && res.expected && (
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1.5">Expected Output:</p>
                    <pre className="p-3 rounded-md bg-green-500/5 border border-green-500/30 whitespace-pre-wrap">{res.expected}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
      <Code2 size={48} className="mb-4 opacity-50" />
      <p className="text-lg font-medium mb-2">No Results Yet</p>
      <p className="text-sm">Run your code to see the test results here.</p>
    </div>
  );
};

const CustomDialog = ({ isOpen, onClose, onConfirm, title, children }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: () => void;
    title: string; 
    children: React.ReactNode 
}) => {
    if (!isOpen) return null;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="text-destructive" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <div className="mt-2 text-sm text-muted-foreground">
                {children}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose} 
              className="inline-flex h-10 px-6 py-2 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              className="inline-flex h-10 px-6 py-2 items-center justify-center rounded-md bg-destructive text-destructive-foreground text-sm font-medium transition-colors hover:bg-destructive/90"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    );
};

// --- MAIN COMPONENT ---

export default function MachineTestInterface({ testData }: { testData: MachineTest }) {
  const router = useRouter();
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [code, setCode] = useState<{ [problemId: number]: string }>({});
  const [languageId, setLanguageId] = useState<LanguageId>(71);
  const [customInput, setCustomInput] = useState('');
  const [results, setResults] = useState<{ [problemId: number]: ProblemResult }>({});
  const [problemStatuses, setProblemStatuses] = useState<{ [problemId: number]: ProblemStatus }>({});
  const [activeTab, setActiveTab] = useState<'output' | 'input'>('output');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeProblem = useMemo(() => testData.problems[activeProblemIndex].problem, [testData, activeProblemIndex]);
  
  // Get current problem points safely
  const currentProblemPoints = useMemo(() => {
    const problemData = testData.problems[activeProblemIndex] as ExtendedProblem;
    return problemData.points ?? 100;
  }, [testData, activeProblemIndex]);

  // Initialize code state
  useEffect(() => {
    if (activeProblem && !code[activeProblem.id]) {
      setCode(prev => ({ ...prev, [activeProblem.id]: languageMap[languageId].boilerplate }));
    }
  }, [activeProblem, code, languageId]);

  const currentCode = useMemo(() => {
    return code[activeProblem.id] ?? languageMap[languageId].boilerplate;
  }, [code, activeProblem.id, languageId]);

  // Auto-save functionality
  useEffect(() => {
    if (currentCode && currentCode !== languageMap[languageId].boilerplate) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        localStorage.setItem(`code_${activeProblem.id}`, currentCode);
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentCode, activeProblem.id, languageId]);

  // Load saved code
  useEffect(() => {
    const saved = localStorage.getItem(`code_${activeProblem.id}`);
    if (saved && !code[activeProblem.id]) {
      setCode(prev => ({ ...prev, [activeProblem.id]: saved }));
    }
  }, [activeProblem.id, code]);

  // Prevent accidental page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isTestSubmitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTestSubmitted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [customInput, activeProblem.id]);

  const handleCodeChange = (value: string | undefined) => {
    setCode(prev => ({ ...prev, [activeProblem.id]: value || '' }));
  };
  
  const handleLanguageChange = (newLangId: LanguageId) => {
    setLanguageId(newLangId);
    if (!code[activeProblem.id]) {
      setCode(prev => ({ ...prev, [activeProblem.id]: languageMap[newLangId].boilerplate }));
    }
  };

  const handleResetCode = () => {
    if (confirm('Are you sure you want to reset your code to the boilerplate?')) {
      setCode(prev => ({ ...prev, [activeProblem.id]: languageMap[languageId].boilerplate }));
    }
  };

  const submitCode = async (isFinalSubmit: boolean, input?: string) => {
    if (isTestSubmitted && isFinalSubmit) return;

    const problemId = activeProblem.id;
    setResults(prev => ({ ...prev, [problemId]: { status: 'running' } }));
    setActiveTab('output');

    try {
      const result = await submitMachineTestCode(problemId, {
        source_code: btoa(unescape(encodeURIComponent(currentCode))),
        language_id: languageId,
        stdin: input ? btoa(unescape(encodeURIComponent(input))) : undefined,
        machineTestId: testData.id,
      });
      
      setResults(prev => ({ ...prev, [problemId]: { status: 'success', data: result } }));
      
      // Update problem status
      setProblemStatuses(prev => ({
        ...prev,
        [problemId]: {
          attempted: true,
          passed: result.passedCount === result.totalCases,
          score: result.score
        }
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setResults(prev => ({ ...prev, [problemId]: { status: 'error', data: { error: errorMessage } as any } }));
      setProblemStatuses(prev => ({
        ...prev,
        [problemId]: { attempted: true, passed: false, score: 0 }
      }));
    }
  };

  const handleRunCode = () => {
    submitCode(false, customInput);
  };

  const handleFinalSubmit = () => {
    setIsModalOpen(false);
    setIsTestSubmitted(true);
    // Submit all problems or show results
    router.push(`/machine-test-results/${testData.id}`);
  };

  const navigateProblem = (direction: 'next' | 'prev') => {
    if (direction === 'next' && activeProblemIndex < testData.problems.length - 1) {
      setActiveProblemIndex(prev => prev + 1);
    } else if (direction === 'prev' && activeProblemIndex > 0) {
      setActiveProblemIndex(prev => prev - 1);
    }
  };
  
  const baseButtonStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const totalScore = Object.values(problemStatuses).reduce((sum, status) => sum + status.score, 0);
  const attemptedCount = Object.values(problemStatuses).filter(s => s.attempted).length;
  
  // Get endTime safely
  const endTime = (testData as any).endTime;
  
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Problem Sidebar */}
      <ProblemSidebar 
        problems={testData.problems as ExtendedProblem[]}
        activeProblemIndex={activeProblemIndex}
        onSelectProblem={setActiveProblemIndex}
        problemStatuses={problemStatuses}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Top Bar - Mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2">
            <Menu size={20} />
          </button>
          <Timer endTime={endTime} />
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={isTestSubmitted}
            className="text-destructive font-semibold text-sm"
          >
            Submit
          </button>
        </div>

        {/* Left Panel: Problem Description */}
        <div className="hidden lg:flex lg:w-2/5 flex-col border-r border-border">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">Problem {activeProblemIndex + 1}</h2>
              <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
                {currentProblemPoints} pts
              </span>
            </div>
            <Timer endTime={endTime} />
          </div>
          <ProblemDescription problem={activeProblem} />
        </div>
        
        {/* Right Panel: Editor and I/O */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Section */}
          <div className={`${isFullscreen ? 'h-full' : 'h-3/5'} flex flex-col border-b border-border`}>
            {/* Editor Toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border bg-card px-4 py-2 gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={languageId}
                  onChange={(e) => handleLanguageChange(parseInt(e.target.value, 10) as LanguageId)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.values(languageMap).map(({ id, name }) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                
                <Tooltip text="Reset Code">
                  <button 
                    onClick={handleResetCode}
                    className={`${baseButtonStyles} h-8 w-8 p-0 bg-background hover:bg-accent hover:text-accent-foreground`}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </Tooltip>

                <Tooltip text={editorTheme === 'vs-dark' ? 'Light Theme' : 'Dark Theme'}>
                  <button 
                    onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
                    className={`${baseButtonStyles} h-8 w-8 p-0 bg-background hover:bg-accent hover:text-accent-foreground`}
                  >
                    {editorTheme === 'vs-dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                </Tooltip>
              </div>

              <div className="flex items-center gap-3">
                <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                
                <div className="hidden lg:flex items-center gap-2">
                  <Tooltip text="Previous Problem">
                    <button 
                      onClick={() => navigateProblem('prev')} 
                      disabled={activeProblemIndex === 0} 
                      className={`${baseButtonStyles} h-8 w-8 p-0 bg-background hover:bg-accent hover:text-accent-foreground`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <span className="text-sm font-medium px-2">
                    {activeProblemIndex + 1} / {testData.problems.length}
                  </span>
                  <Tooltip text="Next Problem">
                    <button 
                      onClick={() => navigateProblem('next')} 
                      disabled={activeProblemIndex === testData.problems.length - 1} 
                      className={`${baseButtonStyles} h-8 w-8 p-0 bg-background hover:bg-accent hover:text-accent-foreground`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>

                <Tooltip text={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`${baseButtonStyles} h-8 w-8 p-0 bg-background hover:bg-accent hover:text-accent-foreground`}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={languageMap[languageId].editorLang}
                value={currentCode}
                onChange={handleCodeChange}
                theme={editorTheme}
                options={{ 
                  minimap: { enabled: false }, 
                  fontSize: 14, 
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
              />
            </div>
          </div>
          
          {/* I/O Section */}
          {!isFullscreen && (
            <div className="h-2/5 flex flex-col border-t border-border bg-card">
              {/* Tabs Header */}
              <div className="flex-shrink-0 border-b border-border px-4 flex items-center justify-between">
                <div className="flex -mb-px">
                  <button 
                    onClick={() => setActiveTab('output')} 
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'output' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                  >
                    Test Output
                  </button>
                  <button 
                    onClick={() => setActiveTab('input')} 
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'input' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                  >
                    Custom Input
                  </button>
                </div>
                
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">
                    {attemptedCount}/{testData.problems.length} attempted
                  </span>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    disabled={isTestSubmitted}
                    className={`${baseButtonStyles} bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 gap-2`}
                  >
                    <Lock className="h-4 w-4" /> 
                    <span>Submit Test</span>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'output' && <TestOutputPanel result={results[activeProblem.id]} />}
                {activeTab === 'input' && (
                  <div className="h-full p-4">
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                      Enter custom input to test your code (Ctrl+Enter to run)
                    </label>
                    <textarea
                      placeholder="Type your test input here..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="h-[calc(100%-2rem)] w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 border-t border-border p-3 flex justify-end gap-3 bg-card">
                <Tooltip text="Run with custom input (Ctrl+Enter)">
                  <button
                    onClick={handleRunCode}
                    disabled={results[activeProblem.id]?.status === 'running'}
                    className={`${baseButtonStyles} border-2 border-primary/20 bg-background hover:bg-accent hover:border-primary/40 h-10 px-5 py-2 gap-2`}
                  >
                    <Play size={16} /> 
                    <span>Run Code</span>
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <CustomDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleFinalSubmit}
        title="Submit Machine Test?"
      >
        <p className="mb-3">
          This will finalize and submit your entire test. You won't be able to make any changes after submission.
        </p>
        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium mb-2">Your Progress:</p>
          <ul className="space-y-1">
            <li>• Problems Attempted: {attemptedCount} / {testData.problems.length}</li>
            <li>• Total Score: {totalScore}</li>
          </ul>
        </div>
        <p className="mt-3 font-medium">Are you sure you want to submit?</p>
      </CustomDialog>
    </div>
  );
}