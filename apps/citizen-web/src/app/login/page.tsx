"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import TranslateIcon from "@mui/icons-material/Translate";
import { useAuthStore } from "@/store/authStore";
import { mockUser } from "@/services/mockData";
import GramLanguageSelector from "@/components/ui/GramLanguageSelector";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuthStore();

  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [langOpen, setLangOpen] = useState(false);

  const handleSendOtp = () => {
    if (mobile.length !== 10 || isNaN(Number(mobile))) {
      setError(
        t("login.invalidMobile", "Please enter a valid 10-digit number"),
      );
      return;
    }
    setError("");
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      setError(t("login.invalidOtp", "Invalid OTP. Please try again."));
      return;
    }
    setError("");
    // Mock successful login
    login({ ...mockUser, mobile }, "mock-token-12345");
    router.push("/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <IconButton
          onClick={() => setLangOpen(true)}
          sx={{
            color: "white",
            bgcolor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(4px)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
          }}
        >
          <TranslateIcon />
        </IconButton>
        <GramLanguageSelector
          open={langOpen}
          onClose={() => setLangOpen(false)}
        />
      </Box>

      <Container
        maxWidth="xs"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 1,
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                bgcolor: "rgba(255,255,255,0.2)",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <Image
                src="/logo.png"
                alt="GramSathi AI Logo"
                width={80}
                height={80}
                style={{ objectFit: "cover", borderRadius: "16px" }}
              />
            </Box>
            <Typography
              variant="h4"
              fontWeight={700}
              color="white"
              sx={{ mb: 1 }}
            >
              {t("common.appName", "GramSathi AI")}
            </Typography>
            <Typography variant="subtitle1" color="rgba(255,255,255,0.8)">
              {t("login.welcome", "Welcome to GramSathi AI")}
            </Typography>
          </Box>

          <Paper
            elevation={24}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: "background.paper",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <AnimatePresence mode="wait">
              {step === "mobile" ? (
                <motion.div
                  key="mobile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PhoneIphoneIcon color="primary" />{" "}
                    {t("login.enterMobile", "Enter Mobile Number")}
                  </Typography>

                  <TextField
                    fullWidth
                    autoFocus
                    placeholder={t(
                      "login.mobilePlaceholder",
                      "10-digit mobile number",
                    )}
                    variant="outlined"
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setMobile(val);
                    }}
                    error={!!error}
                    helperText={error}
                    InputProps={{
                      startAdornment: (
                        <Typography
                          sx={{
                            mr: 1,
                            color: "text.secondary",
                            fontWeight: 500,
                          }}
                        >
                          +91
                        </Typography>
                      ),
                      sx: {
                        borderRadius: 2,
                        fontSize: "1.1rem",
                        letterSpacing: 1,
                      },
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSendOtp}
                    disabled={mobile.length !== 10}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {t("login.sendOtp", "Send OTP")}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setStep("mobile");
                        setError("");
                      }}
                      sx={{ mr: 1, ml: -1 }}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <VerifiedUserIcon color="primary" />{" "}
                      {t("login.enterOtp", "Enter OTP")}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {t("login.otpSent", "OTP sent to +91")} {mobile}.{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "primary.main",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      onClick={() => setStep("mobile")}
                    >
                      {t("login.changeNumber", "Change")}
                    </Box>
                  </Typography>

                  <TextField
                    fullWidth
                    autoFocus
                    placeholder="• • • •"
                    variant="outlined"
                    type="tel"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setOtp(val);
                    }}
                    error={!!error}
                    helperText={error}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        fontSize: "1.5rem",
                        letterSpacing: 8,
                        textAlign: "center",
                        "& input": { textAlign: "center" },
                      },
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleVerifyOtp}
                    disabled={otp.length < 4}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {t("login.verifyOtp", "Verify & Login")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
