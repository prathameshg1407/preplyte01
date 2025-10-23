"use client"

export interface User {
  id: string
  name: string
  email: string
  totalPoints: number
}

export interface Course {
  id: string
  title: string
  description: string
  imageUrl: string
  totalModules: number
}

export interface UserCourse {
  id: string
  userId: string
  courseId: string
  enrolledAt: Date
  completedAt: Date | null
  progress: number
  pointsEarned: number
  course: Course
}

export interface CourseModule {
  id: string
  courseId: string
  title: string
  description: string
  content: string
  order: number
  isLocked: boolean
  pointsValue: number
}

export interface UserModuleProgress {
  id: string
  userId: string
  moduleId: string
  completedAt: Date | null
  testScore: number | null
  module: CourseModule
}

export interface CourseTest {
  id: string
  moduleId: string
  title: string
  description: string
  questions: TestQuestion[]
  passingScore: number
  pointsValue: number
}

export interface TestQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface UserTestAttempt {
  id: string
  userId: string
  testId: string
  score: number
  answers: number[]
  completedAt: Date
}

// New interfaces for major tests and coding challenges
export interface MajorTest {
  id: string
  courseId: string
  title: string
  description: string
  mcqQuestions: TestQuestion[]
  codingChallenges?: CodingChallenge[]
  passingScore: number
  pointsValue: number
  canRetake: boolean
}

export interface CodingChallenge {
  id: string
  title: string
  description: string
  starterCode: string
  expectedOutput: string
  testCases: TestCase[]
  language: string
}

export interface TestCase {
  input: string
  expectedOutput: string
  description: string
}

export interface UserMajorTestAttempt {
  id: string
  userId: string
  majorTestId: string
  mcqScore: number
  codingScore: number
  totalScore: number
  mcqAnswers: number[]
  codingSubmissions: string[]
  completedAt: Date
}

// Mock user data
export const mockUser: User = {
  id: "1",
  name: "Alex Johnson",
  email: "alex@example.com",
  totalPoints: 2450,
}

// Mock courses
export const mockCourses: Course[] = [
  {
    id: "1",
    title: "React Fundamentals",
    description: "Learn the basics of React development",
    imageUrl: "/react-development-course.png",
    totalModules: 8,
  },
  {
    id: "2",
    title: "TypeScript Mastery",
    description: "Master TypeScript for better JavaScript development",
    imageUrl: "/typescript-course.png",
    totalModules: 6,
  },
  {
    id: "3",
    title: "Node.js Backend",
    description: "Build scalable backend applications with Node.js",
    imageUrl: "/nodejs-backend.png",
    totalModules: 10,
  },
  {
    id: "4",
    title: "Database Design",
    description: "Learn database design principles and SQL",
    imageUrl: "/database-design-sql.png",
    totalModules: 7,
  },
  {
    id: "5",
    title: "Python for Data Science",
    description: "Analyze data and build machine learning models with Python",
    imageUrl: "/python-data-science.png",
    totalModules: 12,
  },
  {
    id: "6",
    title: "UI/UX Design Principles",
    description: "Create beautiful and user-friendly interfaces",
    imageUrl: "/ui-ux-design.png",
    totalModules: 9,
  },
  {
    id: "7",
    title: "DevOps Essentials",
    description: "Learn CI/CD, Docker, and cloud deployment strategies",
    imageUrl: "/devops-essentials.png",
    totalModules: 11,
  },
  {
    id: "8",
    title: "Mobile App Development",
    description: "Build cross-platform mobile apps with React Native",
    imageUrl: "/mobile-app-development.png",
    totalModules: 14,
  },
]

// Mock course modules
export const mockCourseModules: CourseModule[] = [
  // React Fundamentals modules
  {
    id: "1-1",
    courseId: "1",
    title: "Introduction to React",
    description: "Understanding React and its core concepts",
    content: `Welcome to React Fundamentals! In this module, you'll learn the core concepts that make React such a powerful library for building user interfaces.

React is a JavaScript library developed by Facebook (now Meta) for building user interfaces, particularly web applications. It's designed to make it easy to create interactive UIs by breaking them down into reusable components.

Key Concepts:

1. **Component-Based Architecture**: React applications are built using components - small, reusable pieces of code that represent parts of a user interface. Think of components like LEGO blocks that you can combine to build complex structures.

2. **Virtual DOM**: React uses a Virtual DOM, which is a JavaScript representation of the real DOM. This allows React to efficiently update only the parts of the page that have changed, making applications faster and more responsive.

3. **JSX**: JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files. It makes React components more readable and easier to write.

4. **Declarative Programming**: With React, you describe what the UI should look like for any given state, and React takes care of updating the DOM when the state changes.

Why React?
- **Reusability**: Components can be reused across different parts of your application
- **Maintainability**: Code is organized into small, focused components
- **Performance**: Virtual DOM ensures efficient updates
- **Large Ecosystem**: Huge community and extensive library support

In the next sections, we'll dive deeper into these concepts and start building your first React components!`,
    order: 1,
    isLocked: false,
    pointsValue: 100,
  },
  {
    id: "1-2",
    courseId: "1",
    title: "Components and Props",
    description: "Building reusable components with props",
    content: `Now that you understand what React is, let's dive into the heart of React: Components and Props.

**What are Components?**

Components are the building blocks of React applications. They are JavaScript functions or classes that return JSX (JavaScript XML) to describe what should appear on the screen.

There are two types of components:
1. **Function Components**: Simple JavaScript functions that return JSX
2. **Class Components**: ES6 classes that extend React.Component (less common in modern React)

**Function Component Example:**
\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}
\`\`\`

**What are Props?**

Props (short for properties) are how you pass data from parent components to child components. They are read-only and help make components reusable.

Think of props like function parameters - they allow you to customize how a component behaves and what it displays.

**Key Rules about Props:**
- Props are immutable (read-only)
- They flow down from parent to child (one-way data flow)
- You can pass any JavaScript value as a prop: strings, numbers, objects, functions, etc.

**Example with Props:**
\`\`\`jsx
function UserCard(props) {
  return (
    <div className="user-card">
      <h2>{props.name}</h2>
      <p>Age: {props.age}</p>
      <p>Email: {props.email}</p>
    </div>
  );
}

// Using the component
<UserCard name="John Doe" age={30} email="john@example.com" />
\`\`\`

**Destructuring Props:**
You can make your code cleaner by destructuring props:

\`\`\`jsx
function UserCard({ name, age, email }) {
  return (
    <div className="user-card">
      <h2>{name}</h2>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
    </div>
  );
}
\`\`\`

**Default Props:**
You can provide default values for props:

\`\`\`jsx
function Button({ text = "Click me", color = "blue" }) {
  return <button style={{ backgroundColor: color }}>{text}</button>;
}
\`\`\`

Components and props are fundamental to React development. They enable you to build complex UIs from simple, reusable pieces. In the next module, we'll learn about state and how to make components interactive!`,
    order: 2,
    isLocked: false,
    pointsValue: 120,
  },
  {
    id: "1-3",
    courseId: "1",
    title: "State and Events",
    description: "Managing component state and handling events",
    content: "Learn about useState hook and event handling...",
    order: 3,
    isLocked: false,
    pointsValue: 150,
  },
  {
    id: "1-4",
    courseId: "1",
    title: "Lists and Keys",
    description: "Rendering lists and understanding keys",
    content: "How to render dynamic lists in React...",
    order: 4,
    isLocked: false,
    pointsValue: 130,
  },
  {
    id: "1-5",
    courseId: "1",
    title: "Forms and Controlled Components",
    description: "Building forms with controlled components",
    content: "Creating forms and handling user input...",
    order: 5,
    isLocked: false,
    pointsValue: 140,
  },
  {
    id: "1-6",
    courseId: "1",
    title: "Effect Hook",
    description: "Side effects with useEffect",
    content: "Understanding useEffect for side effects...",
    order: 6,
    isLocked: false,
    pointsValue: 160,
  },
  {
    id: "1-7",
    courseId: "1",
    title: "Context API",
    description: "State management with Context",
    content: "Using React Context for global state...",
    order: 7,
    isLocked: false,
    pointsValue: 170,
  },
  {
    id: "1-8",
    courseId: "1",
    title: "React Router",
    description: "Navigation with React Router",
    content: "Building single-page applications with routing...",
    order: 8,
    isLocked: false,
    pointsValue: 180,
  },
  // TypeScript Mastery modules
  {
    id: "2-1",
    courseId: "2",
    title: "TypeScript Basics",
    description: "Introduction to TypeScript fundamentals",
    content: "Learn TypeScript syntax and basic types...",
    order: 1,
    isLocked: false,
    pointsValue: 90,
  },
  {
    id: "2-2",
    courseId: "2",
    title: "Advanced Types",
    description: "Complex type definitions and generics",
    content: "Master advanced TypeScript type system...",
    order: 2,
    isLocked: false,
    pointsValue: 110,
  },
  {
    id: "2-3",
    courseId: "2",
    title: "Interfaces and Classes",
    description: "Object-oriented programming in TypeScript",
    content: "Building robust applications with OOP...",
    order: 3,
    isLocked: false,
    pointsValue: 120,
  },
  {
    id: "2-4",
    courseId: "2",
    title: "Modules and Namespaces",
    description: "Code organization and modularity",
    content: "Organizing TypeScript code effectively...",
    order: 4,
    isLocked: true,
    pointsValue: 100,
  },
  {
    id: "2-5",
    courseId: "2",
    title: "Decorators and Metadata",
    description: "Advanced TypeScript features",
    content: "Using decorators for meta-programming...",
    order: 5,
    isLocked: true,
    pointsValue: 130,
  },
  {
    id: "2-6",
    courseId: "2",
    title: "TypeScript with React",
    description: "Building React apps with TypeScript",
    content: "Combining React and TypeScript best practices...",
    order: 6,
    isLocked: true,
    pointsValue: 140,
  },
]

// Mock user module progress
export const mockUserModuleProgress: UserModuleProgress[] = [
  // React Fundamentals progress (completed course)
  {
    id: "1-1-1",
    userId: "1",
    moduleId: "1-1",
    completedAt: new Date("2024-01-16"),
    testScore: 95,
    module: mockCourseModules[0],
  },
  {
    id: "1-2-1",
    userId: "1",
    moduleId: "1-2",
    completedAt: new Date("2024-01-18"),
    testScore: 88,
    module: mockCourseModules[1],
  },
  {
    id: "1-3-1",
    userId: "1",
    moduleId: "1-3",
    completedAt: new Date("2024-01-20"),
    testScore: 92,
    module: mockCourseModules[2],
  },
  {
    id: "1-4-1",
    userId: "1",
    moduleId: "1-4",
    completedAt: new Date("2024-01-22"),
    testScore: 90,
    module: mockCourseModules[3],
  },
  {
    id: "1-5-1",
    userId: "1",
    moduleId: "1-5",
    completedAt: new Date("2024-01-25"),
    testScore: 94,
    module: mockCourseModules[4],
  },
  {
    id: "1-6-1",
    userId: "1",
    moduleId: "1-6",
    completedAt: new Date("2024-01-28"),
    testScore: 87,
    module: mockCourseModules[5],
  },
  {
    id: "1-7-1",
    userId: "1",
    moduleId: "1-7",
    completedAt: new Date("2024-02-02"),
    testScore: 91,
    module: mockCourseModules[6],
  },
  {
    id: "1-8-1",
    userId: "1",
    moduleId: "1-8",
    completedAt: new Date("2024-02-05"),
    testScore: 96,
    module: mockCourseModules[7],
  },
  // TypeScript Mastery progress (75% complete)
  {
    id: "2-1-1",
    userId: "1",
    moduleId: "2-1",
    completedAt: new Date("2024-02-02"),
    testScore: 89,
    module: mockCourseModules[8],
  },
  {
    id: "2-2-1",
    userId: "1",
    moduleId: "2-2",
    completedAt: new Date("2024-02-05"),
    testScore: 93,
    module: mockCourseModules[9],
  },
  {
    id: "2-3-1",
    userId: "1",
    moduleId: "2-3",
    completedAt: new Date("2024-02-08"),
    testScore: 85,
    module: mockCourseModules[10],
  },
  {
    id: "2-4-1",
    userId: "1",
    moduleId: "2-4",
    completedAt: new Date("2024-02-12"),
    testScore: 91,
    module: mockCourseModules[11],
  },
  // Module 2-5 and 2-6 not completed yet
]

// Mock user course enrollments
export const mockUserCourses: UserCourse[] = [
  {
    id: "1",
    userId: "1",
    courseId: "1",
    enrolledAt: new Date("2024-01-15"),
    completedAt: new Date("2024-02-20"),
    progress: 100,
    pointsEarned: 800,
    course: mockCourses[0],
  },
  {
    id: "2",
    userId: "1",
    courseId: "2",
    enrolledAt: new Date("2024-02-01"),
    completedAt: null,
    progress: 75,
    pointsEarned: 450,
    course: mockCourses[1],
  },
  {
    id: "3",
    userId: "1",
    courseId: "3",
    enrolledAt: new Date("2024-02-15"),
    completedAt: null,
    progress: 40,
    pointsEarned: 320,
    course: mockCourses[2],
  },
  {
    id: "4",
    userId: "1",
    courseId: "4",
    enrolledAt: new Date("2024-01-01"),
    completedAt: new Date("2024-01-28"),
    progress: 100,
    pointsEarned: 880,
    course: mockCourses[3],
  },
]

// Mock test questions
export const mockCourseTests: CourseTest[] = [
  {
    id: "test-1-1",
    moduleId: "1-1",
    title: "Introduction to React Quiz",
    description: "Test your understanding of React basics",
    passingScore: 70,
    pointsValue: 50,
    questions: [
      {
        id: "q1-1-1",
        question: "What is React?",
        options: [
          "A JavaScript library for building user interfaces",
          "A database management system",
          "A CSS framework",
          "A server-side programming language",
        ],
        correctAnswer: 0,
        explanation:
          "React is a JavaScript library developed by Facebook for building user interfaces, particularly web applications.",
      },
      {
        id: "q1-1-2",
        question: "What is JSX?",
        options: [
          "A new programming language",
          "A syntax extension for JavaScript",
          "A CSS preprocessor",
          "A database query language",
        ],
        correctAnswer: 1,
        explanation:
          "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files.",
      },
      {
        id: "q1-1-3",
        question: "What is the Virtual DOM?",
        options: ["A real DOM element", "A JavaScript representation of the real DOM", "A CSS framework", "A database"],
        correctAnswer: 1,
        explanation:
          "The Virtual DOM is a JavaScript representation of the real DOM that React uses to optimize updates and improve performance.",
      },
    ],
  },
  {
    id: "test-1-2",
    moduleId: "1-2",
    title: "Components and Props Quiz",
    description: "Test your knowledge of React components and props",
    passingScore: 70,
    pointsValue: 60,
    questions: [
      {
        id: "q1-2-1",
        question: "How do you pass data to a React component?",
        options: ["Through props", "Through state", "Through context", "Through refs"],
        correctAnswer: 0,
        explanation: "Props (properties) are used to pass data from parent components to child components in React.",
      },
      {
        id: "q1-2-2",
        question: "Are props mutable or immutable?",
        options: ["Mutable", "Immutable", "Sometimes mutable", "Depends on the component"],
        correctAnswer: 1,
        explanation: "Props are immutable in React. A component cannot modify its own props; they are read-only.",
      },
    ],
  },
  {
    id: "test-2-1",
    moduleId: "2-1",
    title: "TypeScript Basics Quiz",
    description: "Test your understanding of TypeScript fundamentals",
    passingScore: 70,
    pointsValue: 45,
    questions: [
      {
        id: "q2-1-1",
        question: "What is TypeScript?",
        options: [
          "A JavaScript runtime",
          "A superset of JavaScript that adds static typing",
          "A CSS framework",
          "A database",
        ],
        correctAnswer: 1,
        explanation:
          "TypeScript is a superset of JavaScript that adds static type definitions, helping catch errors at compile time.",
      },
      {
        id: "q2-1-2",
        question: "How do you define a variable with a specific type in TypeScript?",
        options: [
          "let name: string = 'John'",
          "let name = 'John': string",
          "string name = 'John'",
          "let name as string = 'John'",
        ],
        correctAnswer: 0,
        explanation:
          "In TypeScript, you define a variable with a type using the syntax: let variableName: type = value",
      },
    ],
  },
]

// Mock user test attempts
export const mockUserTestAttempts: UserTestAttempt[] = [
  {
    id: "attempt-1-1",
    userId: "1",
    testId: "test-1-1",
    score: 95,
    answers: [0, 1, 1],
    completedAt: new Date("2024-01-16"),
  },
  {
    id: "attempt-1-2",
    userId: "1",
    testId: "test-1-2",
    score: 88,
    answers: [0, 1],
    completedAt: new Date("2024-01-18"),
  },
  {
    id: "attempt-2-1",
    userId: "1",
    testId: "test-2-1",
    score: 89,
    answers: [1, 0],
    completedAt: new Date("2024-02-02"),
  },
]

// Mock major tests data
export const mockMajorTests: MajorTest[] = [
  {
    id: "major-1",
    courseId: "1",
    title: "React Fundamentals Final Assessment",
    description: "Comprehensive test covering all React concepts with practical coding challenges",
    passingScore: 75,
    pointsValue: 300,
    canRetake: false,
    mcqQuestions: [
      {
        id: "mq1-1",
        question: "What is the correct way to update state in a functional component?",
        options: [
          "setState(newValue)",
          "useState(newValue)",
          "const [state, setState] = useState(); setState(newValue)",
          "state = newValue",
        ],
        correctAnswer: 2,
        explanation: "In functional components, you use the useState hook and call the setter function returned by it.",
      },
      {
        id: "mq1-2",
        question: "When should you use useEffect with an empty dependency array?",
        options: [
          "When you want the effect to run on every render",
          "When you want the effect to run only once after the initial render",
          "When you want the effect to never run",
          "When you want the effect to run before every render",
        ],
        correctAnswer: 1,
        explanation:
          "An empty dependency array means the effect runs only once after the initial render, similar to componentDidMount.",
      },
      {
        id: "mq1-3",
        question: "What is the purpose of keys in React lists?",
        options: [
          "To make lists look better",
          "To help React identify which items have changed, been added, or removed",
          "To sort the list items",
          "To add styling to list items",
        ],
        correctAnswer: 1,
        explanation:
          "Keys help React identify which items have changed, been added, or removed, enabling efficient re-rendering.",
      },
    ],
    codingChallenges: [
      {
        id: "cc1-1",
        title: "Todo List Component",
        description: "Create a functional Todo List component with add, delete, and toggle functionality",
        language: "javascript",
        starterCode: `import React, { useState } from 'react';

function TodoList() {
  // Your code here
  
  return (
    <div>
      {/* Your JSX here */}
    </div>
  );
}

export default TodoList;`,
        expectedOutput: "A working todo list with add, delete, and toggle functionality",
        testCases: [
          {
            input: "Add 'Learn React'",
            expectedOutput: "Todo item 'Learn React' appears in the list",
            description: "Should be able to add new todo items",
          },
          {
            input: "Click on todo item",
            expectedOutput: "Todo item gets marked as completed/uncompleted",
            description: "Should be able to toggle todo completion status",
          },
        ],
      },
    ],
  },
  {
    id: "major-2",
    courseId: "2",
    title: "TypeScript Mastery Final Assessment",
    description: "Advanced TypeScript concepts and practical implementation",
    passingScore: 75,
    pointsValue: 250,
    canRetake: false,
    mcqQuestions: [
      {
        id: "mq2-1",
        question: "What is the correct way to define a generic interface in TypeScript?",
        options: [
          "interface MyInterface<T> { value: T }",
          "interface MyInterface(T) { value: T }",
          "interface MyInterface[T] { value: T }",
          "interface MyInterface{T} { value: T }",
        ],
        correctAnswer: 0,
        explanation: "Generic interfaces use angle brackets <T> to define type parameters.",
      },
    ],
    codingChallenges: [
      {
        id: "cc2-1",
        title: "Generic Array Utility",
        description: "Create a generic utility function that filters an array based on a predicate",
        language: "typescript",
        starterCode: `// Create a generic filter function
function filterArray<T>(/* your parameters here */) {
  // Your implementation here
}

// Example usage:
// const numbers = [1, 2, 3, 4, 5];
// const evenNumbers = filterArray(numbers, (n) => n % 2 === 0);`,
        expectedOutput: "A working generic filter function",
        testCases: [
          {
            input: "filterArray([1,2,3,4,5], n => n % 2 === 0)",
            expectedOutput: "[2, 4]",
            description: "Should filter even numbers",
          },
        ],
      },
    ],
  },
]

// Mock user major test attempts
export const mockUserMajorTestAttempts: UserMajorTestAttempt[] = [
  // User has completed React major test
  {
    id: "major-attempt-1",
    userId: "1",
    majorTestId: "major-1",
    mcqScore: 85,
    codingScore: 90,
    totalScore: 87,
    mcqAnswers: [2, 1, 1],
    codingSubmissions: ["/* React Todo List implementation */"],
    completedAt: new Date("2024-02-20"),
  },
]

// Mock leaderboard data and enrollment counts
export const mockLeaderboard = [
  { id: "1", name: "Alex Johnson", totalPoints: 2450, rank: 1 },
  { id: "2", name: "Sarah Chen", totalPoints: 2380, rank: 2 },
  { id: "3", name: "Mike Rodriguez", totalPoints: 2250, rank: 3 },
  { id: "4", name: "Emily Davis", totalPoints: 2100, rank: 4 },
  { id: "5", name: "David Kim", totalPoints: 1950, rank: 5 },
  { id: "6", name: "Lisa Wang", totalPoints: 1850, rank: 6 },
  { id: "7", name: "John Smith", totalPoints: 1720, rank: 7 },
  { id: "8", name: "Anna Brown", totalPoints: 1650, rank: 8 },
]

// Mock enrollment counts and total points for each course
export const mockCourseStats: { [key: string]: { enrollments: number; totalPoints: number } } = {
  "1": { enrollments: 1247, totalPoints: 1160 },
  "2": { enrollments: 892, totalPoints: 790 },
  "3": { enrollments: 756, totalPoints: 1200 },
  "4": { enrollments: 634, totalPoints: 880 },
  "5": { enrollments: 523, totalPoints: 1450 },
  "6": { enrollments: 445, totalPoints: 980 },
  "7": { enrollments: 387, totalPoints: 1320 },
  "8": { enrollments: 298, totalPoints: 1680 },
}

// Helper functions
export const getActiveCourses = () => mockUserCourses.filter((uc) => !uc.completedAt)
export const getCompletedCourses = () => mockUserCourses.filter((uc) => uc.completedAt)
export const getTotalPoints = () => mockUserCourses.reduce((sum, uc) => sum + uc.pointsEarned, 0)

// Helper function to check if user is enrolled in a course
export const isUserEnrolledInCourse = (courseId: string) => mockUserCourses.some((uc) => uc.courseId === courseId)

// Helper function to get available courses (not enrolled)
export const getAvailableCourses = () => mockCourses.filter((course) => !isUserEnrolledInCourse(course.id))

// Helper function to get course by ID
export const getCourseById = (courseId: string) => mockCourses.find((course) => course.id === courseId)

// Helper function to get modules for a course
export const getModulesByCourseId = (courseId: string) =>
  mockCourseModules.filter((module) => module.courseId === courseId).sort((a, b) => a.order - b.order)

// Helper function to get user's progress for a course
export const getUserCourseProgress = (courseId: string) => mockUserCourses.find((uc) => uc.courseId === courseId)

// Helper function to get user's module progress
export const getUserModuleProgress = (moduleId: string) =>
  mockUserModuleProgress.find((ump) => ump.moduleId === moduleId)

// Helper function to check if a module is unlocked
export const isModuleUnlocked = (courseId: string, moduleOrder: number) => {
  const modules = getModulesByCourseId(courseId)
  const previousModule = modules.find((m) => m.order === moduleOrder - 1)

  // First module is always unlocked
  if (moduleOrder === 1) return true

  // Check if previous module is completed
  if (previousModule) {
    const progress = getUserModuleProgress(previousModule.id)
    return progress?.completedAt !== null
  }

  return false
}

// Helper function to get test by module ID
export const getTestByModuleId = (moduleId: string) => mockCourseTests.find((test) => test.moduleId === moduleId)

// Helper function to get user's test attempt
export const getUserTestAttempt = (testId: string) => mockUserTestAttempts.find((attempt) => attempt.testId === testId)

// Helper function to get module by ID
export const getModuleById = (moduleId: string) => mockCourseModules.find((module) => module.id === moduleId)

// Helper function to get leaderboard
export const getLeaderboard = () => mockLeaderboard

// Helper function to get course stats
export const getCourseStats = (courseId: string) => mockCourseStats[courseId] || { enrollments: 0, totalPoints: 0 }

// Helper function to get next module
export const getNextModule = (courseId: string, currentModuleId: string) => {
  const modules = getModulesByCourseId(courseId)
  const currentModule = modules.find((m) => m.id === currentModuleId)
  if (!currentModule) return null

  const nextModule = modules.find((m) => m.order === currentModule.order + 1)
  return nextModule || null
}

// Modified helper function to only count first attempt points
export const getTotalPointsFirstAttemptOnly = () => {
  const firstAttempts = new Map()

  // Get only first attempts for each test
  mockUserTestAttempts.forEach((attempt) => {
    if (!firstAttempts.has(attempt.testId) || firstAttempts.get(attempt.testId).completedAt > attempt.completedAt) {
      firstAttempts.set(attempt.testId, attempt)
    }
  })

  // Calculate points from first attempts only
  let totalPoints = 0
  firstAttempts.forEach((attempt) => {
    const test = mockCourseTests.find((t) => t.id === attempt.testId)
    if (test && attempt.score >= test.passingScore) {
      totalPoints += test.pointsValue
    }
  })

  return totalPoints
}

export const getMajorTestByCourseId = (courseId: string) => mockMajorTests.find((test) => test.courseId === courseId)

export const getUserMajorTestAttempt = (majorTestId: string) =>
  mockUserMajorTestAttempts.find((attempt) => attempt.majorTestId === majorTestId)

export const isCodingCourse = (courseId: string) => codingCourses.includes(courseId)

export const areAllModulesCompleted = (courseId: string) => {
  const modules = getModulesByCourseId(courseId)
  return modules.every((module) => {
    const progress = getUserModuleProgress(module.id)
    return progress?.completedAt !== null
  })
}

export const getTotalPointsWithMajorTests = () => {
  let totalPoints = getTotalPointsFirstAttemptOnly()

  // Add major test points
  mockUserMajorTestAttempts.forEach((attempt) => {
    const majorTest = mockMajorTests.find((test) => test.id === attempt.majorTestId)
    if (majorTest && attempt.totalScore >= majorTest.passingScore) {
      totalPoints += majorTest.pointsValue
    }
  })

  return totalPoints
}

const codingCourses = ["1", "2", "3", "5", "7", "8"] // React, TypeScript, Node.js, Python, DevOps, Mobile
