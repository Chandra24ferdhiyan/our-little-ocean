'use client';

import React, { createContext, useContext } from 'react';
import { useAquariumStore } from './aquariumStore';

type AquariumStoreType = ReturnType<typeof useAquariumStore>;

const AquariumContext = createContext<AquariumStoreType | null>(null);

export function AquariumProvider({ children }: { children: React.ReactNode }) {
  const store = useAquariumStore();
  return (
    <AquariumContext.Provider value={store}>
      {children}
    </AquariumContext.Provider>
  );
}

export function useAquarium() {
  const context = useContext(AquariumContext);
  if (!context) {
    throw new Error('useAquarium must be used within an AquariumProvider');
  }
  return context;
}
