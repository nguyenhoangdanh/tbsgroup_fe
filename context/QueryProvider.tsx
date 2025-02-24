"use client";
import { lazy, ReactNode, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Props {
    children: ReactNode;
}

const ReactQueryDevtoolsProduction = lazy(() =>
    import('@tanstack/react-query-devtools/build/modern/production.js').then(
        (d) => ({
            default: d.ReactQueryDevtools,
        }),
    ),
);

export default function QueryProvider({ children }: Props) {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Suspense fallback={null}>
                <ReactQueryDevtoolsProduction />
            </Suspense>
        </QueryClientProvider>
    );
}