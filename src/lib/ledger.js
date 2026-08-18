import { createContext, useContext } from 'react';

// Shared across every page: the subject list, the one function that writes it
// back to Supabase, and the week the report pages are looking at.
export const LedgerContext = createContext(null);

export function useLedger() {
  const value = useContext(LedgerContext);
  if (!value) throw new Error('useLedger must be used inside a LedgerContext provider');
  return value;
}