import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type FilterOption = { value: string; label: string };

export type FilterField =
  | { type: 'search'; name: string; label: string; placeholder?: string; minWidth?: number }
  | { type: 'select'; name: string; label: string; options: FilterOption[]; minWidth?: number; allLabel?: string }
  | { type: 'date'; name: string; label: string; minWidth?: number }
  | { type: 'number'; name: string; label: string; minWidth?: number; placeholder?: string }
  | { type: 'text'; name: string; label: string; placeholder?: string; minWidth?: number };

type Props = {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onReset: () => void;
  /** Extra controls rendered on the right of the reset button (export, import…). */
  actions?: React.ReactNode;
};

/**
 * Filter bar shared by every list screen. All filters apply together, and the
 * active ones are echoed as removable chips so it is obvious what is narrowing
 * the table.
 */
export function TableFilters({ fields, values, onChange, onReset, actions }: Props) {
  const activeFilters = useMemo(
    () =>
      fields
        .filter((field) => (values[field.name] ?? '') !== '')
        .map((field) => {
          const raw = values[field.name];
          const label =
            field.type === 'select'
              ? field.options.find((option) => option.value === raw)?.label ?? raw
              : raw;

          return { name: field.name, label: `${field.label}: ${label}` };
        }),
    [fields, values]
  );

  return (
    <Card sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        {fields.map((field) => {
          const value = values[field.name] ?? '';

          if (field.type === 'select') {
            return (
              <FormControl key={field.name} size="small" sx={{ minWidth: field.minWidth ?? 150 }}>
                <InputLabel id={`filter-${field.name}`}>{field.label}</InputLabel>
                <Select
                  labelId={`filter-${field.name}`}
                  label={field.label}
                  value={value}
                  onChange={(event) => onChange(field.name, event.target.value as string)}
                >
                  <MenuItem value="">{field.allLabel ?? 'All'}</MenuItem>
                  {field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          if (field.type === 'date') {
            return (
              <TextField
                key={field.name}
                size="small"
                type="date"
                label={field.label}
                value={value}
                onChange={(event) => onChange(field.name, event.target.value)}
                sx={{ minWidth: field.minWidth ?? 165 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            );
          }

          if (field.type === 'number') {
            return (
              <TextField
                key={field.name}
                size="small"
                type="number"
                label={field.label}
                placeholder={field.placeholder}
                value={value}
                onChange={(event) => onChange(field.name, event.target.value)}
                sx={{ minWidth: field.minWidth ?? 120 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            );
          }

          return (
            <TextField
              key={field.name}
              size="small"
              label={field.label}
              placeholder={field.placeholder}
              value={value}
              onChange={(event) => onChange(field.name, event.target.value)}
              sx={{ minWidth: field.minWidth ?? (field.type === 'search' ? 240 : 180) }}
              slotProps={{
                input:
                  field.type === 'search'
                    ? {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }
                    : undefined,
              }}
            />
          );
        })}

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {actions}
          <Button
            variant="outlined"
            color="inherit"
            onClick={onReset}
            disabled={activeFilters.length === 0}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Clear
          </Button>
        </Stack>
      </Box>

      {activeFilters.length > 0 && (
        <>
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {activeFilters.length} active filter{activeFilters.length > 1 ? 's' : ''}:
            </Typography>
            {activeFilters.map((filter) => (
              <Chip
                key={filter.name}
                size="small"
                label={filter.label}
                onDelete={() => onChange(filter.name, '')}
              />
            ))}
          </Stack>
        </>
      )}
    </Card>
  );
}
