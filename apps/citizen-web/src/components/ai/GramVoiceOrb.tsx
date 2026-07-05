"use client";

import Box from "@mui/material/Box";
import { styled, keyframes } from "@mui/material/styles";

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.7; }
`;

const orbit = keyframes`
  0% { transform: rotate(0deg) translateX(8px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(8px) rotate(-360deg); }
`;

const OrbContainer = styled(Box)({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 120,
  height: 120,
});

const Core = styled(Box)<{ state: string }>(({ state }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  background:
    state === "listening"
      ? "radial-gradient(circle, #1565C0, #0D47A1)"
      : state === "processing"
        ? "radial-gradient(circle, #F57F17, #E65100)"
        : state === "speaking"
          ? "radial-gradient(circle, #2E7D32, #1B5E20)"
          : "radial-gradient(circle, #9E9E9E, #616161)",
  boxShadow: `0 0 20px ${
    state === "listening"
      ? "rgba(21, 101, 192, 0.5)"
      : state === "processing"
        ? "rgba(245, 127, 23, 0.5)"
        : state === "speaking"
          ? "rgba(46, 125, 50, 0.5)"
          : "rgba(158, 158, 158, 0.5)"
  }`,
  animation:
    state === "listening" || state === "speaking"
      ? `${pulse} 1.5s ease-in-out infinite`
      : "none",
  transition: "background 0.3s ease",
  zIndex: 2,
}));

const Ring = styled(Box)<{ state: string; delay: number }>(
  ({ state, delay }) => ({
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "2px solid",
    borderColor:
      state === "listening"
        ? "rgba(21, 101, 192, 0.3)"
        : state === "processing"
          ? "rgba(245, 127, 23, 0.3)"
          : state === "speaking"
            ? "rgba(46, 125, 50, 0.3)"
            : "rgba(158, 158, 158, 0.3)",
    animation:
      state === "listening" || state === "speaking"
        ? `${orbit} 3s ${delay}s linear infinite`
        : "none",
  }),
);

interface GramVoiceOrbProps {
  state: "idle" | "listening" | "processing" | "speaking";
  size?: number;
  ariaLabel?: string;
}

export default function GramVoiceOrb({
  state,
  size = 120,
  ariaLabel,
}: GramVoiceOrbProps) {
  return (
    <OrbContainer
      sx={{ width: size, height: size }}
      role="status"
      aria-label={ariaLabel || `Voice assistant is ${state}`}
      aria-live="polite"
    >
      <Core state={state} />
      <Ring state={state} delay={0} />
      <Ring state={state} delay={0.5} />
      <Ring state={state} delay={1} />
    </OrbContainer>
  );
}
