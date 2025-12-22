"use client";

import { createContext, useContext, useState } from "react";

export const EditorContext = createContext(null);

export function EditorProvider({ children }) {
  const [hasDataSourceNode, setHasDataSourceNode] = useState(false);

  return (
    <EditorContext.Provider value={{ hasDataSourceNode, setHasDataSourceNode }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within EditorProvider");
  return context;
}
