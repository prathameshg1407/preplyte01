// This file extends the built-in types of NextAuth.js
import 'next-auth';
import { DefaultSession } from 'next-auth';

// By declaring this module, we are extending the original module's types.
declare module 'next-auth' {
  /**
   * The shape of the session object returned by useSession() or getSession().
   * We are adding our custom 'accessToken' property to the session.
   */
  interface Session {
    accessToken?: string;
    user: {
      /** The user's unique identifier. */
      id: string;
    } & DefaultSession['user']; // Keep the default user properties
  }
}

declare module 'next-auth/jwt' {
  /**
   * The shape of the JWT token returned by the jwt callback.
   * We are adding our custom 'accessToken' to the token.
   */
  interface JWT {
    accessToken?: string;
  }
}