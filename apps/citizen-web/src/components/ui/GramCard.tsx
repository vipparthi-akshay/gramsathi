"use client";

import { ReactNode, MouseEvent, KeyboardEvent } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  transition: "box-shadow 0.2s ease, transform 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
  },
  "&.clickable": {
    cursor: "pointer",
  },
  "&.elevation-0": {
    boxShadow: "none",
  },
  "&.elevation-1": {
    boxShadow:
      "0px 1px 3px 1px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.30)",
  },
  "&.elevation-2": {
    boxShadow:
      "0px 2px 6px 2px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.30)",
  },
  "&.elevation-3": {
    boxShadow:
      "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px 0px rgba(0,0,0,0.30)",
  },
}));

interface GramCardProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  avatar?: string | ReactNode;
  icon?: ReactNode;
  actionArea?: boolean;
  onClick?: () => void;
  elevation?: 0 | 1 | 2 | 3;
  actions?: ReactNode;
  media?: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export default function GramCard({
  children,
  title,
  subtitle,
  description,
  image,
  avatar,
  icon,
  actionArea = false,
  onClick,
  elevation = 1,
  actions,
  media,
  ariaLabel,
  className,
}: GramCardProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const content = (
    <>
      {(image || media) &&
        (media || (
          <CardMedia
            component="img"
            height="160"
            image={image}
            alt={title || ""}
            sx={{ objectFit: "cover" }}
          />
        ))}
      <CardContent sx={{ pb: actions ? 1 : 2 }}>
        {(avatar || icon) && (
          <Box
            sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1.5 }}
          >
            {avatar && typeof avatar === "string" ? (
              <Avatar
                src={avatar}
                alt={title || ""}
                sx={{ width: 40, height: 40 }}
              />
            ) : (
              avatar
            )}
            {icon && (
              <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
            )}
          </Box>
        )}
        {title && (
          <Typography variant="h6" component="h3" gutterBottom>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {subtitle}
          </Typography>
        )}
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
        {children}
      </CardContent>
      {actions && (
        <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>{actions}</CardActions>
      )}
    </>
  );

  return (
    <StyledCard
      className={`elevation-${elevation} ${actionArea ? "clickable" : ""} ${className || ""}`}
      aria-label={ariaLabel}
    >
      {actionArea ? (
        <CardActionArea
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          role="button"
          tabIndex={0}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </StyledCard>
  );
}
