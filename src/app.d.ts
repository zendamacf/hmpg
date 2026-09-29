import type { InferSelectModel } from 'drizzle-orm';
import type { image } from '$lib/server/db/schema';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      photo: InferSelectModel<typeof image> | null;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
