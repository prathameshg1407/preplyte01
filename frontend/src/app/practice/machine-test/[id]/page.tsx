import { getMachineTestByIdServer } from '@/lib/api/machine-test.server';
import ErrorMessage from '@/components/ErrorMessage';
import MachineTestInterface from '@/components/practice/machine-test/MachineTestInterface';

interface MachineTestPageProps {
  params: {
    id: string;
  };
}

// This is a Next.js Server Component. It's responsible for fetching the initial
// data for the test on the server before rendering the page.
export default async function MachineTestPage({ params }: MachineTestPageProps) {
  const testId = parseInt(params.id, 10);

  // Validate that the ID from the URL is a valid number.
  if (isNaN(testId)) {
    return (
      <main className="container mx-auto flex h-screen items-center justify-center">
        <ErrorMessage title="Invalid Test ID" message="The test ID provided in the URL is not valid." />
      </main>
    );
  }

  try {
    // Fetch the test data using a server-side function. This keeps your data fetching
    // logic separate from your client-side components.
    const testData = await getMachineTestByIdServer(testId);
    
    // Pass the fetched data as a prop to the client component that handles the interactive UI.
    return <MachineTestInterface testData={testData} />;
  } catch (error) {
    // If data fetching fails (e.g., test not found, API error), display a user-friendly error message.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while loading the test.';
    return (
      <main className="container mx-auto flex h-screen items-center justify-center">
        <ErrorMessage
          title="Failed to Load Test"
          message={errorMessage}
        />
      </main>
    );
  }
}
