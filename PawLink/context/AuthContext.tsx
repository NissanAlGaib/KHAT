import {
  useContext,
  createContext,
  useEffect,
  useMemo,
  useCallback,
  type PropsWithChildren,
} from "react";
import { useStorageState } from "@/hooks/useStorageState";
import { isAxiosError } from "axios";
import axiosInstance from "../config/axiosConfig";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  credits: number | null;
  // Add other user properties as needed
}
interface AuthContextType {
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  session?: string | null;
  user?: User | null;
  isLoading: boolean;
  updateUser: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  user: null,
  isLoading: false,
  updateUser: async () => {},
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be used within an AuthProvider");
    }
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState<string>("session");
  const [[, user], setUser] = useStorageState<User>("user");

  const handleUpdateUser = useCallback(
    async (userData: any) => {
      try {
        await setUser(userData);
      } catch (e) {
        console.error("Error updating user data:", e);
        throw e;
      }
    },
    [setUser]
  );

  const handleSignOut = useCallback(async () => {
    try {
      if (session) {
        await axiosInstance.post("/api/logout", null, {
          headers: {
            Authorization: `Bearer ${session}`,
          },
        });
      }
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setSession(null);
      setUser(null);
      delete axiosInstance.defaults.headers.common["Authorization"];
      // navigation will be handled by the RootNavigator based on session state
    }
  }, [session, setSession, setUser]);

  const handleSignIn = useCallback(
    async (token: string, userData: User) => {
      try {
        await setSession(token);
        await setUser(userData);
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${token}`;
        // navigation will be handled by the RootNavigator or the calling screen
      } catch (e) {
        console.error("Error during sign in:", e);
        throw e;
      }
    },
    [setSession, setUser]
  );

  useEffect(() => {
    if (!session) return;

    // ensure axiosInstance has the header for subsequent requests
    axiosInstance.defaults.headers.common["Authorization"] =
      `Bearer ${session}`;

    // define the loader inside the effect so it doesn't need to be a dependency
    const loadUserInfo = async (token: string) => {
      try {
        // use axiosInstance so baseURL and interceptors apply
        const response = await axiosInstance.get("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data as User);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          setSession(null);
          setUser(null);
          // navigation will be handled by the RootNavigator based on session state
        } else {
          console.error("Error fetching user info:", error);
        }
      }
    };

    // Only load user if we don't have one yet
    if (!user) {
      loadUserInfo(session);
    }
  }, [session, user, setUser, setSession]);

  const contextValue = useMemo(
    () => ({
      signIn: handleSignIn,
      signOut: handleSignOut,
      session,
      user: user ?? null,
      isLoading,
      updateUser: handleUpdateUser,
    }),
    [handleSignIn, handleSignOut, session, user, isLoading, handleUpdateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
