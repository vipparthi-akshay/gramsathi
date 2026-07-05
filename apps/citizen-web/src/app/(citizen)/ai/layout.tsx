"use client";

import { ReactNode } from "react";
import Box from "@mui/material/Box";

export default function AILayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{ height: "100vh", display: "flex", flexDirection: "column", pb: 9 }}
    >
      {children}
    </Box>
  );
}
