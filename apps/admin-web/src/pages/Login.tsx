import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  Avatar,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { useAuth } from "@/store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, "otp-" + otp);
      navigate("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1A237E 100%)",
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: "100%",
          borderRadius: 3,
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: -3,
            mb: 1,
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "primary.main",
              boxShadow: "0 4px 14px rgba(21,101,192,0.4)",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            GS
          </Avatar>
        </Box>

        <CardContent sx={{ px: 4, pb: 4 }}>
          <Typography
            variant="h5"
            textAlign="center"
            sx={{ fontWeight: 700, mb: 0.5 }}
          >
            GramSathi AI
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 3 }}
          >
            Admin Dashboard — Sign in to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {!showOtp ? (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Official Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                size="medium"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                placeholder="admin@gramsathi.gov.in"
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size="medium"
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Remember me</Typography>}
                />
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ cursor: "pointer", fontWeight: 500 }}
                >
                  Forgot password?
                </Typography>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 1.5, py: 1.2 }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Divider sx={{ my: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowOtp(true)}
                disabled={!email}
              >
                Sign in with OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                OTP sent to <strong>{email}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                size="medium"
                sx={{ mb: 2 }}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: "center",
                    letterSpacing: 8,
                    fontSize: 20,
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || otp.length < 6}
                sx={{ mb: 1, py: 1.2 }}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => setShowOtp(false)}
              >
                Back to password login
              </Button>
            </form>
          )}

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: "action.hover",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5 }}
            >
              Demo Credentials:
            </Typography>
            <Typography variant="caption" display="block">
              Admin: admin@gramsathi.gov.in / admin123
            </Typography>
            <Typography variant="caption" display="block">
              Officer: officer@gramsathi.gov.in / officer123
            </Typography>
            <Typography variant="caption" display="block">
              Super Admin: superadmin@gramsathi.gov.in / super123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
