"use client";
import React, { createContext, useState } from "react";

type DialogContextType = {
  dialog: {
    open: boolean;
  };
  setDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
    }>
  >;
};

export const DialogContext = createContext<DialogContextType | null>(null);

export default function DialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dialog, setDialog] = useState<{
    open: boolean;
  }>({
    open: false,
  });

  return (
    <DialogContext.Provider value={{ dialog, setDialog }}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}
