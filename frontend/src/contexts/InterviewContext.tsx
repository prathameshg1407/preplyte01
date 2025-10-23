// // src/contexts/InterviewContext.tsx
// 'use client';

// import React, { createContext, useContext, useState, ReactNode } from 'react';
// import { useVapi } from 'vapi-react';

// // Define the shape of the context state
// interface InterviewContextType {
//   vapi: ReturnType<typeof useVapi>['vapi'];
//   isCallStarted: boolean;
//   isCallActive: boolean;
//   isCallEnding: boolean;
//   activeAssistantId: string | null;
//   conversation: any[];
//   startCall: (assistantId: string, metadata?: Record<string, any>) => Promise<void>;
//   stopCall: () => Promise<void>;
// }

// const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

// export function InterviewProvider({ children }: { children: ReactNode }) {
//   const {
//     vapi,
//     start,
//     stop,
//     toggle,
//     volume,
//     setVolume,
//     isMuted,
//     toggleMute,
//     audioLevel,
//     callState,
//     speechState,
//     activeAssistant,
//     error,
//   } = useVapi('YOUR_VAPI_PUBLIC_KEY'); // 👈 Replace with your actual Vapi Public Key

//   // Map Vapi states to simple boolean flags
//   const isCallStarted = callState === 'started';
//   const isCallActive = callState === 'connected';
//   const isCallEnding = callState === 'ending' || callState === 'ended';
//   const activeAssistantId = activeAssistant?.id || null;

//   // Function to start the call with an assistant and metadata
//   const startCall = async (assistantId: string, metadata: Record<string, any> = {}) => {
//     await start(assistantId, metadata);
//   };

//   // Function to stop the call
//   const stopCall = async () => {
//     await stop();
//   };

//   // Memoize the value to prevent unnecessary re-renders
//   const value = React.useMemo(
//     () => ({
//       vapi,
//       isCallStarted,
//       isCallActive,
//       isCallEnding,
//       activeAssistantId,
//       conversation: [], // Placeholder for conversation history
//       startCall,
//       stopCall,
//     }),
//     [
//       vapi,
//       isCallStarted,
//       isCallActive,
//       isCallEnding,
//       activeAssistantId,
//       startCall,
//       stopCall,
//     ],
//   );

//   return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
// }

// export function useInterview() {
//   const context = useContext(InterviewContext);
//   if (context === undefined) {
//     throw new Error('useInterview must be used within an InterviewProvider');
//   }
//   return context;
// }