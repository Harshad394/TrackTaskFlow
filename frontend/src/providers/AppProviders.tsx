"use client";

import { ReactNode } from "react";
import QueryProvider from "./QueryProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {/* Additional global providers (e.g. ThemeProvider, ToastProvider) can go here */}
      {children}
    </QueryProvider>
  );
}
