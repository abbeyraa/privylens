"use client";

import { EditorProvider } from "@/app/editor/context/EditorContext";

export default function EditorProviderWrapper({ children }) {
  return <EditorProvider>{children}</EditorProvider>;
}
