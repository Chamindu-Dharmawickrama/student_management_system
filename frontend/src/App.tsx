import { lazy, Suspense, useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES, USER_ROLES } from "./constants/app.constants";
import { ProtectedRoute } from "./shared/guards/ProtectedRoute";
import { GuestRoute } from "./shared/guards/GuestRoute";
import { useAppDispatch } from "./app/hooks";
import { restoreSession } from "./features/auth/slices/authSlice";

import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";

export default function App() {
    const dispatch = useAppDispatch();

    // prevent duplicate restore
    const sessionRestored = useRef(false);

    // ensures restoreSession fires exactly once per page load.
    useEffect(() => {
        if (sessionRestored.current) return;
        sessionRestored.current = true;
        dispatch(restoreSession());
    }, [dispatch]);

    return (
        <ErrorBoundary>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "var(--color-bg-card)",
                        color: "var(--color-text-primary)",
                        border: "1px solid var(--color-border)",
                        boxShadow: "var(--shadow-lg)",
                    },
                    success: {
                        iconTheme: {
                            primary: "hsl(180, 60%, 50%)",
                            secondary: "#111",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "var(--color-danger)",
                            secondary: "#fff",
                        },
                    },
                }}
            />
            <>
                <h1>Welcome to the App</h1>
            </>
        </ErrorBoundary>
    );
}
