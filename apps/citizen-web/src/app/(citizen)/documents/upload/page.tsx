"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GramButton from "@/components/ui/GramButton";
import GramUploadZone from "@/components/documents/GramUploadZone";
import GramDocumentPreview from "@/components/documents/GramDocumentPreview";

const steps = ["Upload", "Review", "Confirm"];

const docTypes = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "voter", label: "Voter ID" },
  { value: "bank", label: "Bank Passbook" },
  { value: "income", label: "Income Certificate" },
  { value: "caste", label: "Caste Certificate" },
  { value: "domicile", label: "Domicile Certificate" },
  { value: "birth", label: "Birth Certificate" },
];

export default function DocumentUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");

  const handleFileSelect = (f: File) => {
    setFile(f);
    setStep(1);
  };

  return (
    <Box
      sx={{ minHeight: "100vh", pb: 9, backgroundColor: "background.default" }}
    >
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <IconButton onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            Upload Document
          </Typography>
        </Box>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Select Document Type
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
              {docTypes.map((dt) => (
                <GramButton
                  key={dt.value}
                  variant={docType === dt.value ? "primary" : "outlined"}
                  size="small"
                  onClick={() => setDocType(dt.value)}
                >
                  {dt.label}
                </GramButton>
              ))}
            </Box>
            {docType && (
              <GramUploadZone
                onFileSelect={handleFileSelect}
                accept="image/*,.pdf"
                maxSizeMB={10}
              />
            )}
          </Box>
        )}

        {step === 1 && file && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Review Extracted Information
            </Typography>
            <GramDocumentPreview
              thumbnail="https://via.placeholder.com/100x120?text=Document"
              documentType={
                docTypes.find((d) => d.value === docType)?.label || ""
              }
              status="needs_review"
              fields={[
                { label: "Name", value: "Ram Sharma", confidence: 95 },
                { label: "DOB", value: "15/08/1985", confidence: 90 },
                { label: "Number", value: "XXXX-XXXX-1234", confidence: 85 },
              ]}
              onEditField={(label) => console.log(`Edit ${label}`)}
            />
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <GramButton variant="outlined" onClick={() => setStep(0)}>
                Re-upload
              </GramButton>
              <GramButton variant="primary" onClick={() => setStep(2)}>
                Looks Good
              </GramButton>
            </Box>
          </Box>
        )}

        {step === 2 && (
          <Card sx={{ borderRadius: 3, textAlign: "center", py: 4 }}>
            <CardContent>
              <Typography
                variant="h5"
                color="success.main"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                ✓ Document Uploaded!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your document has been submitted for verification. This usually
                takes 1-2 business days.
              </Typography>
              <GramButton
                variant="primary"
                onClick={() => router.push("/documents")}
              >
                Go to Documents
              </GramButton>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
