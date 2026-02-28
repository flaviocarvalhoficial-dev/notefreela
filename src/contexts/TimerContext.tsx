import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase";
import { useQueryClient } from "@tanstack/react-query";

export interface ActiveTimerState {
    entryId: string | null;
    projectId: string | null;
    projectName: string | null;
    taskId: string | null;
    taskTitle: string | null;
    startedAt: Date | null;
    elapsed: number; // seconds
    isRunning: boolean;
}

interface TimerContextValue {
    timer: ActiveTimerState;
    start: (params: { projectId?: string | null; projectName?: string | null; taskId?: string | null; taskTitle?: string | null }) => Promise<void>;
    stop: () => Promise<void>;
    isStarting: boolean;
    isStopping: boolean;
}

const STORAGE_KEY = "notefreela_active_timer";

const defaultTimer: ActiveTimerState = {
    entryId: null,
    projectId: null,
    projectName: null,
    taskId: null,
    taskTitle: null,
    startedAt: null,
    elapsed: 0,
    isRunning: false,
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [timer, setTimer] = useState<ActiveTimerState>(() => {
        // Recover from localStorage on mount
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.isRunning && parsed.startedAt) {
                    const startedAt = new Date(parsed.startedAt);
                    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
                    return { ...parsed, startedAt, elapsed };
                }
            }
        } catch {
            // ignore
        }
        return defaultTimer;
    });

    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Tick every second when running
    useEffect(() => {
        if (timer.isRunning && timer.startedAt) {
            intervalRef.current = setInterval(() => {
                setTimer(prev => {
                    if (!prev.startedAt || !prev.isRunning) return prev;
                    const elapsed = Math.floor((Date.now() - prev.startedAt.getTime()) / 1000);
                    return { ...prev, elapsed };
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [timer.isRunning, timer.startedAt]);

    // Persist to localStorage whenever timer changes
    useEffect(() => {
        if (timer.isRunning) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...timer,
                startedAt: timer.startedAt?.toISOString(),
            }));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [timer]);

    const start = useCallback(async ({
        projectId = null,
        projectName = null,
        taskId = null,
        taskTitle = null,
    }: {
        projectId?: string | null;
        projectName?: string | null;
        taskId?: string | null;
        taskTitle?: string | null;
    }) => {
        setIsStarting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            // Stop any currently running timer first
            if (timer.isRunning && timer.entryId) {
                const now = new Date();
                const duration = timer.startedAt
                    ? Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)
                    : 0;
                await supabase
                    .from("time_entries" as never)
                    .update({ ended_at: now.toISOString(), duration_seconds: duration } as never)
                    .eq("id", timer.entryId);
            }

            const startedAt = new Date();
            const { data, error } = await supabase
                .from("time_entries" as never)
                .insert({
                    user_id: user.id,
                    project_id: projectId,
                    task_id: taskId,
                    started_at: startedAt.toISOString(),
                } as never)
                .select()
                .single();

            if (error) throw error;

            const entry = data as { id: string };
            setTimer({
                entryId: entry.id,
                projectId,
                projectName,
                taskId,
                taskTitle,
                startedAt,
                elapsed: 0,
                isRunning: true,
            });

            queryClient.invalidateQueries({ queryKey: ["time-entries"] });
        } finally {
            setIsStarting(false);
        }
    }, [timer, queryClient]);

    const stop = useCallback(async () => {
        if (!timer.entryId || !timer.isRunning) return;
        setIsStopping(true);
        try {
            const now = new Date();
            const duration = timer.startedAt
                ? Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)
                : 0;

            await supabase
                .from("time_entries" as never)
                .update({ ended_at: now.toISOString(), duration_seconds: duration } as never)
                .eq("id", timer.entryId);

            setTimer(defaultTimer);
            queryClient.invalidateQueries({ queryKey: ["time-entries"] });
        } finally {
            setIsStopping(false);
        }
    }, [timer, queryClient]);

    return (
        <TimerContext.Provider value={{ timer, start, stop, isStarting, isStopping }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer(): TimerContextValue {
    const ctx = useContext(TimerContext);
    if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
    return ctx;
}
