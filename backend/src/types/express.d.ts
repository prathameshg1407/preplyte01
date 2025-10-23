// Create a new folder `types` in your `src` directory.
// Inside `types`, create another folder `express`.
// Place this file inside `src/types/express/`.

import { Role } from '@prisma/client';

// This file uses TypeScript's "declaration merging" to add a custom `user` property
// to the global Express Request interface.
declare global {
  namespace Express {
    // This defines the shape of the user object that will be attached to the request.
    export interface User {
      id: string; // Correctly typed as string to match Prisma's CUID
      email: string;
      role: Role;
      institutionId?: number;
    }

    // This adds the `user` property to the Request interface.
    // It's marked as optional (?) because it will only exist on authenticated routes
    // after the JWT guard has successfully run.
    export interface Request {
      user?: User;
    }
  }
}

// By default, TypeScript files are modules. Adding `export {}` makes this file
// a module and allows declaration merging to work correctly.
export {};
