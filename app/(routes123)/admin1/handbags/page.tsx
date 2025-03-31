"use client";

import { HandBagProvider } from "@/hooks/handbag/HandBagContext";
import HandBagManagementScreen from "@/screens/admin/handbag/Container";
import React from "react";

const HandBagPage = () => {
  return (
    <HandBagProvider>
      <HandBagManagementScreen />
    </HandBagProvider>
  );
};

export default HandBagPage;