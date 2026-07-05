"use client";

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useAppStore } from "@/store/appStore";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "ks", name: "Kashmiri", nativeName: "कॉशुर" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "brx", name: "Bodo", nativeName: "बर" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी" },
  { code: "mni", name: "Manipuri", nativeName: "মৈতৈলোন্" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी" },
  { code: "en", name: "English", nativeName: "English" },
];

interface GramLanguageSelectorProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export default function GramLanguageSelector({
  open,
  onClose,
  title,
}: GramLanguageSelectorProps) {
  const { language, setLanguage } = useAppStore();
  const [search, setSearch] = useState("");

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.includes(search),
  );

  const handleSelect = (code: string) => {
    setLanguage(code);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="language-selector-title"
    >
      <DialogTitle id="language-selector-title">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">
            {title || "common:selectLanguage"}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="Close language selector"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search language..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          aria-label="Search languages"
        />
        <List
          sx={{ maxHeight: 400, overflow: "auto" }}
          role="listbox"
          aria-label="Languages"
        >
          {filtered.map((lang) => (
            <ListItemButton
              key={lang.code}
              selected={language === lang.code}
              onClick={() => handleSelect(lang.code)}
              role="option"
              aria-selected={language === lang.code}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText
                primary={lang.nativeName}
                secondary={lang.name}
                primaryTypographyProps={{
                  fontWeight: language === lang.code ? 600 : 400,
                  fontSize: "1.1rem",
                }}
              />
              {language === lang.code && (
                <ListItemIcon sx={{ minWidth: "auto" }}>
                  <CheckIcon color="primary" />
                </ListItemIcon>
              )}
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
