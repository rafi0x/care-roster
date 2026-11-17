/** Demo logins shown on the sign-in screen. Must match the users created by server/src/scripts/seed.ts. */
export const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@doctortracker.dev', password: 'Admin@12345', note: 'Full access: add, edit and delete' },
  { role: 'Staff', email: 'staff@doctortracker.dev', password: 'Staff@12345', note: 'View only: browse doctors, patients, stats' },
] as const;
