import React, { createContext, useContext, useState, ReactNode } from "react";

type Role = "Pet Owner" | "Shooter";

type RoleContextType = {
  role: Role;
  setRole: (r: Role) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("Pet Owner");

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (ctx) return ctx;
  // Fallback: if no provider is mounted, provide local state so components still work.
  const [role, setRole] = useState<Role>("Pet Owner");
  return { role, setRole };
}

export default RoleContext;
