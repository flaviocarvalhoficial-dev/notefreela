import * as React from "react";

type ValueVisibilityContextValue = {
    hideValues: boolean;
    setHideValues: (hide: boolean) => void;
    toggleHideValues: () => void;
};

const ValueVisibilityContext = React.createContext<ValueVisibilityContextValue | null>(null);

const STORAGE_KEY = "hide-values";

export function ValueVisibilityProvider({ children }: { children: React.ReactNode }) {
    const [hideValues, setHideValuesState] = React.useState<boolean>(false);

    React.useEffect(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
                setHideValuesState(stored === "true");
            }
        } catch {
            // ignore
        }
    }, []);

    React.useEffect(() => {
        if (hideValues) {
            document.documentElement.setAttribute("data-hide-values", "true");
        } else {
            document.documentElement.removeAttribute("data-hide-values");
        }
    }, [hideValues]);

    const setHideValues = React.useCallback((hide: boolean) => {
        setHideValuesState(hide);
        try {
            window.localStorage.setItem(STORAGE_KEY, String(hide));
        } catch {
            // ignore
        }
    }, []);

    const toggleHideValues = React.useCallback(() => {
        const next = !hideValues;
        setHideValues(next);
    }, [hideValues, setHideValues]);

    const value = React.useMemo(
        () => ({ hideValues, setHideValues, toggleHideValues }),
        [hideValues, setHideValues, toggleHideValues]
    );

    return (
        <ValueVisibilityContext.Provider value={value}>
            {children}
        </ValueVisibilityContext.Provider>
    );
}

export function useValueVisibility() {
    const ctx = React.useContext(ValueVisibilityContext);
    if (!ctx) {
        throw new Error("useValueVisibility must be used within ValueVisibilityProvider");
    }
    return ctx;
}
