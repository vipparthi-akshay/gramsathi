"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import SortIcon from "@mui/icons-material/Sort";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import GramSchemeCard from "@/components/ai/GramSchemeCard";
import GramBottomNav from "@/components/ui/GramBottomNav";
import GramVoiceInput from "@/components/ui/GramVoiceInput";
import Dialog from "@mui/material/Dialog";

const categories = [
  "All",
  "Agriculture",
  "Education",
  "Health",
  "Housing",
  "Employment",
  "Social Welfare",
  "Women & Child",
  "Pension",
  "Finance",
  "Energy",
  "Skill Development",
];

const mockSchemes = [
  {
    id: "1",
    name: "PM Kisan Samman Nidhi",
    nameLocal: "पीएम किसान सम्मान निधि",
    match: 95,
    benefits: ["₹6,000/year income support", "For small farmers"],
    category: "Agriculture",
    deadline: "Mar 31, 2026",
  },
  {
    id: "2",
    name: "PM Awas Yojana (Gramin)",
    nameLocal: "पीएम आवास योजना (ग्रामीण)",
    match: 88,
    benefits: ["₹2.5L housing subsidy", "For rural landless"],
    category: "Housing",
    deadline: "Jun 30, 2026",
  },
  {
    id: "3",
    name: "Ujjwala Yojana",
    nameLocal: "उज्ज्वला योजना",
    match: 82,
    benefits: ["Free LPG connection", "For BPL families"],
    category: "Social Welfare",
    deadline: "Dec 31, 2026",
  },
  {
    id: "4",
    name: "PM Fasal Bima Yojana",
    nameLocal: "पीएम फसल बीमा योजना",
    match: 76,
    benefits: ["Crop insurance", "Low premium"],
    category: "Agriculture",
    deadline: "Jul 15, 2026",
  },
  {
    id: "5",
    name: "National Pension Scheme",
    nameLocal: "राष्ट्रीय पेंशन योजना",
    match: 70,
    benefits: ["Pension after 60", "Tax benefits"],
    category: "Pension",
    deadline: "Open",
  },
  {
    id: "6",
    name: "Sukanya Samriddhi Yojana",
    nameLocal: "सुकन्या समृद्धि योजना",
    match: 65,
    benefits: ["Girl child savings", "High interest rate"],
    category: "Women & Child",
    deadline: "Open",
  },
];

export default function SchemesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<"match" | "deadline" | "name">("match");
  const [voiceOpen, setVoiceOpen] = useState(false);

  const filtered = mockSchemes
    .filter((s) => category === "All" || s.category === category)
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.nameLocal.includes(search),
    )
    .sort((a, b) => {
      if (sortBy === "match") return b.match - a.match;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <Box
      sx={{ minHeight: "100vh", pb: 9, backgroundColor: "background.default" }}
    >
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ py: 2 }}>
          Government Schemes
        </Typography>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search schemes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setVoiceOpen(true)}
                  aria-label="Voice search"
                >
                  <MicIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: 28 },
          }}
          aria-label="Search schemes"
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ overflow: "auto", flex: 1, pb: 1 }}
            role="tablist"
            aria-label="Scheme categories"
          >
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onClick={() => setCategory(cat)}
                color={category === cat ? "primary" : "default"}
                variant={category === cat ? "filled" : "outlined"}
                sx={{ borderRadius: 28, whiteSpace: "nowrap" }}
                role="tab"
                aria-selected={category === cat}
              />
            ))}
          </Stack>
          <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              size="small"
            >
              <ToggleButton value="grid" aria-label="Grid view">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list" aria-label="List view">
                <ViewListIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton
              size="small"
              onClick={(e) => setSortAnchor(e.currentTarget)}
              aria-label="Sort options"
            >
              <SortIcon />
            </IconButton>
          </Box>
        </Box>

        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
        >
          <MenuItem
            selected={sortBy === "match"}
            onClick={() => {
              setSortBy("match");
              setSortAnchor(null);
            }}
          >
            Match Score
          </MenuItem>
          <MenuItem
            selected={sortBy === "name"}
            onClick={() => {
              setSortBy("name");
              setSortAnchor(null);
            }}
          >
            Name
          </MenuItem>
          <MenuItem
            selected={sortBy === "deadline"}
            onClick={() => {
              setSortBy("deadline");
              setSortAnchor(null);
            }}
          >
            Deadline
          </MenuItem>
        </Menu>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filtered.length} schemes found
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: view === "grid" ? "1fr 1fr" : "1fr",
            gap: 2,
          }}
        >
          {filtered.map((scheme) => (
            <GramSchemeCard
              key={scheme.id}
              name={scheme.name}
              nameLocal={scheme.nameLocal}
              matchScore={scheme.match}
              benefits={scheme.benefits}
              deadline={scheme.deadline}
              category={scheme.category}
              onApply={() => router.push(`/schemes/${scheme.id}`)}
              onKnowMore={() => router.push(`/schemes/${scheme.id}`)}
            />
          ))}
        </Box>

        {filtered.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No schemes match your criteria
            </Typography>
          </Box>
        )}
      </Container>
      <GramBottomNav />

      <Dialog
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ p: 4, textAlign: "center" }}>
          <GramVoiceInput
            onResult={(text) => {
              setSearch(text);
              setVoiceOpen(false);
            }}
            language="hi-IN"
          />
        </Box>
      </Dialog>
    </Box>
  );
}
