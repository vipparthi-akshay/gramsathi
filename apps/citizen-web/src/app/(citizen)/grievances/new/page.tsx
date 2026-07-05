"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MicIcon from "@mui/icons-material/Mic";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GramButton from "@/components/ui/GramButton";

const steps = ["Describe Issue", "AI Draft", "Review", "Department", "Submit"];

const departments = [
  "Agriculture Department",
  "Revenue Department",
  "Education Department",
  "Health Department",
  "Social Welfare Department",
  "Panchayati Raj",
  "Water Supply Department",
  "Electricity Department",
  "Police Department",
  "Other Department",
];

export default function NewGrievancePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [department, setDepartment] = useState("");

  const handleAIDraft = () => {
    setAiDraft(
      `Subject: Regarding ${description.split(" ").slice(0, 5).join(" ")}...\n\n` +
        `Respected Sir/Madam,\n\n` +
        `I am writing to bring to your attention the issue of ${description}\n\n` +
        `I request you to kindly take necessary action at the earliest.\n\n` +
        `Thanking you,\n[Your Name]\n[Your Address]`,
    );
    setStep(2);
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
            New Complaint
          </Typography>
        </Box>

        <Stepper activeStep={step} sx={{ mb: 4 }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Describe your issue
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={5}
              placeholder="Tell us what happened in your own words..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
              aria-label="Describe your issue"
            />
            <GramButton
              variant="tonal"
              icon={<MicIcon />}
              onClick={() => {}}
              sx={{ mb: 2 }}
            >
              Describe using Voice
            </GramButton>
            <GramButton
              variant="primary"
              fullWidth
              icon={<AutoAwesomeIcon />}
              onClick={handleAIDraft}
              disabled={!description.trim()}
            >
              Generate AI Draft
            </GramButton>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Review Complaint
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              sx={{ mb: 2 }}
              aria-label="Complaint draft"
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <GramButton variant="outlined" onClick={() => setStep(0)}>
                Edit Description
              </GramButton>
              <GramButton variant="primary" onClick={() => setStep(3)}>
                Next: Select Department
              </GramButton>
            </Box>
          </Box>
        )}

        {step === 3 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Select Department
            </Typography>
            <Stack spacing={1}>
              {departments.map((dept) => (
                <Card
                  key={dept}
                  sx={{
                    borderRadius: 2,
                    cursor: "pointer",
                    border:
                      department === dept
                        ? "2px solid"
                        : "2px solid transparent",
                    borderColor:
                      department === dept ? "primary.main" : "transparent",
                  }}
                  onClick={() => setDepartment(dept)}
                >
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography
                      variant="body2"
                      fontWeight={department === dept ? 600 : 400}
                    >
                      {dept}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <GramButton
              variant="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={!department}
              onClick={() => setStep(4)}
            >
              Next: Submit
            </GramButton>
          </Box>
        )}

        {step === 4 && (
          <Card sx={{ borderRadius: 3, textAlign: "center", py: 4 }}>
            <CardContent>
              <Typography
                variant="h5"
                color="success.main"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                ✓ Complaint Submitted!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Complaint No: GRV-2026-{Math.floor(Math.random() * 9000) + 1000}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Expected resolution within 15 days
              </Typography>
              <GramButton
                variant="primary"
                onClick={() => router.push("/grievances")}
              >
                View My Complaints
              </GramButton>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
