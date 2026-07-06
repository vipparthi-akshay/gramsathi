import { useState } from "react";
import {
  Box,
  Checkbox,
  IconButton,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";

export interface ColumnDef<T> {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
}

interface GramTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onExport?: () => void;
  onDelete?: (ids: string[]) => void;
  loading?: boolean;
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
}

export default function GramTable<T>({
  columns,
  data,
  keyExtractor,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  selectable,
  selected = [],
  onSelectionChange,
  onExport,
  onDelete,
  actions,
  emptyMessage = "No data found",
}: GramTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortColumn(column);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(data.map((row) => keyExtractor(row)));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selected, id]);
    } else {
      onSelectionChange(selected.filter((s) => s !== id));
    }
  };

  const numSelected = selected.length;
  const rowCount = data.length;

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2 }}>
      {(selectable || onExport || onDelete) && (
        <Box
          sx={{ display: "flex", alignItems: "center", p: 1, pl: 2, gap: 1 }}
        >
          {selectable && numSelected > 0 && (
            <Typography variant="body2" color="text.secondary">
              {numSelected} selected
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          {onDelete && selected.length > 0 && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(selected)}
            >
              Delete
            </Button>
          )}
          {onExport && (
            <IconButton size="small" onClick={onExport} title="Export">
              <FileDownloadIcon />
            </IconButton>
          )}
        </Box>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ fontWeight: 600 }}>
                  <Checkbox
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || "left"}
                  sx={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    width: col.width,
                  }}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sortColumn === col.id}
                      direction={sortColumn === col.id ? sortDirection : "asc"}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              {actions && (
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                  }
                  align="center"
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 4 }}
                  >
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const id = keyExtractor(row);
                return (
                  <TableRow
                    key={id}
                    hover
                    selected={selected.includes(id)}
                    sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(id)}
                          onChange={(e) => handleSelect(id, e.target.checked)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align || "left"}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                    {actions && <TableCell>{actions(row)}</TableCell>}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={limit}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}
