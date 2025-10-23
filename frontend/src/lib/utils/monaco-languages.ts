export type MonacoLanguageKey = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'java' 
  | 'cpp' 
  | 'c'
  | 'csharp'
  | 'go';

export interface MonacoLanguage {
  label: string;
  monaco: MonacoLanguageKey;
  judge0Id: number;
  fileExtension: string;
  commentSyntax: {
    line: string;
    blockStart?: string;
    blockEnd?: string;
  };
}

export const SUPPORTED_LANGUAGES: MonacoLanguage[] = [
  { 
    label: 'JavaScript (Node.js)', 
    monaco: 'javascript', 
    judge0Id: 63,
    fileExtension: '.js',
    commentSyntax: { line: '//', blockStart: '/*', blockEnd: '*/' },
  },
  { 
    label: 'TypeScript', 
    monaco: 'typescript', 
    judge0Id: 74,
    fileExtension: '.ts',
    commentSyntax: { line: '//', blockStart: '/*', blockEnd: '*/' },
  },
  { 
    label: 'Python 3', 
    monaco: 'python', 
    judge0Id: 71,
    fileExtension: '.py',
    commentSyntax: { line: '#', blockStart: '"""', blockEnd: '"""' },
  },
  { 
    label: 'Java (OpenJDK)', 
    monaco: 'java', 
    judge0Id: 62,
    fileExtension: '.java',
    commentSyntax: { line: '//', blockStart: '/*', blockEnd: '*/' },
  },
  { 
    label: 'C++ (GCC 9.2)', 
    monaco: 'cpp', 
    judge0Id: 54,
    fileExtension: '.cpp',
    commentSyntax: { line: '//', blockStart: '/*', blockEnd: '*/' },
  },
  { 
    label: 'C (GCC 9.2)', 
    monaco: 'c', 
    judge0Id: 50,
    fileExtension: '.c',
    commentSyntax: { line: '//', blockStart: '/*', blockEnd: '*/' },
  },
  { 
    label: 'C# (Mono)', 
    monaco: 'csharp', 
    judge0Id: 51,
    fileExtension: '.cs',
    commentSyntax: { line: '//', blockStart: '/*', blockEnd: '*/' },
  },
  { 
    label: 'Go', 
    monaco: 'go', 
    judge0Id: 60,
    fileExtension: '.go',
    commentSyntax: { line: '//', blockStart: '/*', blockEnd: '*/' },
  },
];

export const DEFAULT_LANGUAGE: MonacoLanguage = SUPPORTED_LANGUAGES[0];

export const STARTER_TEMPLATES: Record<MonacoLanguageKey, string> = {
  javascript: `// Write your solution here
function solve() {
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf8').trim();
  
  // Parse input and implement solution
  const lines = input.split('\\n');
  
  // Your code here
  console.log('Hello from JavaScript');
}

solve();`,

  typescript: `// Write your solution here
function solve(): void {
  const fs = require('fs');
  const input: string = fs.readFileSync(0, 'utf8').trim();
  
  // Parse input and implement solution
  const lines: string[] = input.split('\\n');
  
  // Your code here
  console.log('Hello from TypeScript');
}

solve();`,

  python: `# Write your solution here
import sys

def main():
    # Read input
    lines = sys.stdin.read().strip().split('\\n')
    
    # Your code here
    print("Hello from Python")

if __name__ == "__main__":
    main()`,

  java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // Read input
        String line = br.readLine();
        
        // Your code here
        System.out.println("Hello from Java");
    }
}`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    // Read input
    string line;
    // getline(cin, line);
    
    // Your code here
    cout << "Hello from C++" << endl;
    
    return 0;
}`,

  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Read input
    char line[1000];
    // fgets(line, sizeof(line), stdin);
    
    // Your code here
    printf("Hello from C\\n");
    
    return 0;
}`,

  csharp: `using System;
using System.Collections.Generic;
using System.Linq;

class Program {
    static void Main(string[] args) {
        // Read input
        string line = Console.ReadLine();
        
        // Your code here
        Console.WriteLine("Hello from C#");
    }
}`,

  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    
    // Read input
    // scanner.Scan()
    // line := scanner.Text()
    
    // Your code here
    fmt.Println("Hello from Go")
}`,
};

/**
 * Get language by Monaco language key
 */
export function getLanguageByKey(key: MonacoLanguageKey): MonacoLanguage | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.monaco === key);
}

/**
 * Get language by Judge0 ID
 */
export function getLanguageByJudge0Id(id: number): MonacoLanguage | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.judge0Id === id);
}

/**
 * Get starter template for language
 */
export function getStarterTemplate(language: MonacoLanguageKey): string {
  return STARTER_TEMPLATES[language] || STARTER_TEMPLATES.javascript;
}