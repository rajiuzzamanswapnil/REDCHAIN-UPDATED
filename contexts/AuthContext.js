"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured) {
      setProfile(null);
      return null;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initialise() {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    }
    initialise();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession?.user) await loadProfile(nextSession.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) return loadProfile(session.user.id);
    return null;
  }, [session, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user || null,
      session,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      refreshProfile,
      signOut,
      configured: isSupabaseConfigured,
    }),
    [session, profile, loading, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
