import React, { createContext, useContext, useRef, useCallback } from 'react';

type RefsContextType = {
  registerRef: (id: string, element: HTMLInputElement | null) => void;
  getRef: (id: string) => HTMLInputElement | null;
};

const RefsContext = createContext<RefsContextType | null>(null);

export const RefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const refs = useRef<Record<string, HTMLInputElement>>({});

  const registerRef = useCallback((id: string, element: HTMLInputElement | null) => {
    if (element) {
      refs.current[id] = element;
    } else {
      delete refs.current[id];
    }
  }, []);

  const getRef = useCallback((id: string) => refs.current[id] || null, []);

  return (
    <RefsContext.Provider value={{ registerRef, getRef }}>
      {children}
    </RefsContext.Provider>
  );
};

export const useRefs = () => {
  const context = useContext(RefsContext);
  if (!context) {
    throw new Error('useRefs must be used within a RefsProvider');
  }
  return context;
};
