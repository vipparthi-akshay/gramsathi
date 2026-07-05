import { Box, TextField, Button, MenuItem, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import type { FilterState } from "@/hooks/useFilters";

interface GramFilterBarProps {
  filters: FilterState;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  onApply?: () => void;
  showDateRange?: boolean;
  showStateDistrict?: boolean;
  showStatus?: boolean;
  statusOptions?: { value: string; label: string }[];
  showCategory?: boolean;
  categoryOptions?: { value: string; label: string }[];
  placeholder?: string;
}

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function GramFilterBar({
  filters,
  onFilterChange,
  onClear,
  onApply,
  showDateRange,
  showStateDistrict,
  showStatus,
  statusOptions,
  showCategory,
  categoryOptions,
  placeholder = "Search...",
}: GramFilterBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "center",
        p: 2,
        backgroundColor: "background.paper",
        borderRadius: 2,
        boxShadow: "0px 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flex: "1 1 200px",
          minWidth: 200,
        }}
      >
        <FilterListIcon sx={{ color: "text.secondary" }} />
        <TextField
          size="small"
          placeholder={placeholder}
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          fullWidth
          InputProps={{
            endAdornment: filters.search ? (
              <IconButton
                size="small"
                onClick={() => onFilterChange("search", "")}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
        />
      </Box>

      {showStatus && statusOptions && (
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          {statusOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      )}

      {showCategory && categoryOptions && (
        <TextField
          select
          size="small"
          label="Category"
          value={filters.category}
          onChange={(e) => onFilterChange("category", e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          {categoryOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      )}

      {showStateDistrict && (
        <>
          <TextField
            select
            size="small"
            label="State"
            value={filters.state}
            onChange={(e) => onFilterChange("state", e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {indianStates.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="District"
            value={filters.district}
            onChange={(e) => onFilterChange("district", e.target.value)}
            sx={{ minWidth: 140 }}
          />
        </>
      )}

      {showDateRange && (
        <>
          <TextField
            size="small"
            type="date"
            label="From"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange("dateFrom", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={filters.dateTo}
            onChange={(e) => onFilterChange("dateTo", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
        </>
      )}

      {onApply && (
        <Button variant="contained" onClick={onApply} size="small">
          Apply
        </Button>
      )}

      <Button
        variant="text"
        onClick={onClear}
        size="small"
        color="error"
        startIcon={<ClearIcon />}
      >
        Clear
      </Button>
    </Box>
  );
}
