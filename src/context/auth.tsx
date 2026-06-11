import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Profile = { nickname: string; avatar_url: string | null; location: string | null };

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  profile: null,
  signOut: async () => {},
});

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('nickname, avatar_url, location')
    .eq('id', userId)
    .single();
  return data ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          let p = await fetchProfile(session.user.id);
          if (!p && event === 'SIGNED_IN') {
            const nickname = session.user.user_metadata?.nickname ?? '사용자';
            await supabase.from('profiles').insert({ id: session.user.id, nickname });
            p = await fetchProfile(session.user.id);
          }
          setProfile(p);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, isLoading, user, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
