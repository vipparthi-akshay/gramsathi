"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import BadgeIcon from "@mui/icons-material/Badge";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GramButton from "@/components/ui/GramButton";
import GramBottomNav from "@/components/ui/GramBottomNav";

interface DocItem {
  id: string;
  name: string;
  nameLocal: string;
  status: "verified" | "pending" | "rejected";
  icon: React.ReactNode;
}

const docs: DocItem[] = [
  {
    id: "1",
    name: "Aadhaar Card",
    nameLocal: "आधार कार्ड",
    status: "verified",
    icon: <BadgeIcon />,
  },
  {
    id: "2",
    name: "PAN Card",
    nameLocal: "पैन कार्ड",
    status: "verified",
    icon: <CreditCardIcon />,
  },
  {
    id: "3",
    name: "Bank Passbook",
    nameLocal: "बैंक पासबुक",
    status: "pending",
    icon: <AccountBalanceIcon />,
  },
  {
    id: "4",
    name: "Income Certificate",
    nameLocal: "आय प्रमाण पत्र",
    status: "pending",
    icon: <ReceiptIcon />,
  },
  {
    id: "5",
    name: "Domicile Certificate",
    nameLocal: "अधिवास प्रमाण पत्र",
    status: "rejected",
    icon: <ReceiptIcon />,
  },
];

const statusIcons = {
  verified: <CheckCircleIcon sx={{ color: "success.main" }} />,
  pending: <HourglassEmptyIcon sx={{ color: "warning.main" }} />,
  rejected: <CancelIcon sx={{ color: "error.main" }} />,
};

export default function DocumentsPage() {
  const router = useRouter();

  return (
    <Box
      sx={{ minHeight: "100vh", pb: 9, backgroundColor: "background.default" }}
    >
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Document Center
          </Typography>
          <GramButton
            variant="primary"
            size="small"
            icon={<AddIcon />}
            onClick={() => router.push("/documents/upload")}
          >
            Upload
          </GramButton>
        </Box>

        <Alert severity="info" sx={{ borderRadius: 3, mb: 3 }}>
          AI Tip: Upload clear documents for faster verification
        </Alert>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          My Documents
        </Typography>

        {docs.map((doc) => (
          <Card
            key={doc.id}
            sx={{ borderRadius: 3, mb: 1.5, cursor: "pointer" }}
            onClick={() => router.push("/documents/upload")}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.5,
                "&:last-child": { pb: 1.5 },
              }}
            >
              <Box sx={{ color: "primary.main", display: "flex" }}>
                {doc.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {doc.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {doc.nameLocal}
                </Typography>
              </Box>
              {statusIcons[doc.status]}
              <Chip
                label={doc.status}
                size="small"
                color={
                  doc.status === "verified"
                    ? "success"
                    : doc.status === "pending"
                      ? "warning"
                      : "error"
                }
                sx={{ fontWeight: 500 }}
              />
            </CardContent>
          </Card>
        ))}

        <GramButton
          variant="tonal"
          fullWidth
          icon={<AddIcon />}
          onClick={() => router.push("/documents/upload")}
          sx={{ mt: 2 }}
        >
          Add New Document
        </GramButton>
      </Container>
      <GramBottomNav />
    </Box>
  );
}
