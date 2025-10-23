'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted rounded border">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  ),
});

interface MonacoCodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  height?: string | number;
  theme?: 'vs-dark' | 'light' | 'vs-light' | 'hc-black';
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative';
}

export default function MonacoCodeEditor({
  language,
  value,
  onChange,
  height = 420,
  theme = 'vs-dark',
  readOnly = false,
  minimap = false,
  lineNumbers = 'on',
}: MonacoCodeEditorProps) {
  const [isReady, setIsReady] = useState(false);

  const editorLanguage = useMemo(() => {
    // Map language to Monaco-supported language IDs
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'ruby': 'ruby',
      'php': 'php',
    };
    
    return languageMap[language.toLowerCase()] || 'javascript';
  }, [language]);

  const editorOptions = useMemo(() => ({
    minimap: { enabled: minimap },
    fontSize: 14,
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    tabSize: 2,
    automaticLayout: true,
    readOnly,
    lineNumbers,
    renderLineHighlight: 'all' as const,
    padding: { top: 16, bottom: 16 },
    bracketPairColorization: { enabled: true },
    formatOnPaste: true,
    formatOnType: true,
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
  }), [minimap, readOnly, lineNumbers]);

  return (
    <div className="rounded-lg border overflow-hidden">
      <Editor
        height={height}
        theme={theme}
        language={editorLanguage}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        options={editorOptions}
        onMount={() => setIsReady(true)}
        loading={
          <div className="flex items-center justify-center h-full bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      />
    </div>
  );
}