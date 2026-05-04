/**
 * LanguageFamilyDropdown — Fluent UI v9 combobox for selecting linguistic families.
 *
 * Renders the 17 ALGO-XXX families from the phonological registry with flags.
 * Exclusively uses @fluentui/react-components (Fluent 2) — no style deviations.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Combobox,
  Option,
  makeStyles,
  tokens,
  type ComboboxProps,
} from '@fluentui/react-components';
import { FAMILY_CONFIG, type AlgoFamily } from '../../constants/langFamilyMap';
import { FlagSign } from '../FlagSign';

const useStyles = makeStyles({
  root: {
    minWidth: '200px',
    maxWidth: '320px',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  flag: {
    fontSize: '16px',
    lineHeight: '1',
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  code: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    marginLeft: tokens.spacingHorizontalXS,
  },
});

interface LanguageFamilyDropdownProps {
  value: AlgoFamily | '';
  onChange: (family: AlgoFamily) => void;
  disabled?: boolean;
  label?: string;
}

const FAMILY_ENTRIES = Object.values(FAMILY_CONFIG);

export const LanguageFamilyDropdown = React.memo(function LanguageFamilyDropdown({
  value,
  onChange,
  disabled = false,
  label,
}: LanguageFamilyDropdownProps) {
  const styles = useStyles();

  const handleChange = useCallback<NonNullable<ComboboxProps['onOptionSelect']>>(
    (_ev, data) => {
      if (data.optionValue) {
        onChange(data.optionValue as AlgoFamily);
      }
    },
    [onChange],
  );

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const cfg = FAMILY_CONFIG[value];
    return cfg ? `${cfg.flag} ${cfg.label}` : '';
  }, [value]);

  return (
    <Combobox
      className={styles.root}
      value={selectedLabel}
      selectedOptions={value ? [value] : []}
      onOptionSelect={handleChange}
      disabled={disabled}
      placeholder={label ?? 'Language family'}
      aria-label={label ?? 'Language family'}
    >
      {FAMILY_ENTRIES.map(cfg => (
        <Option key={cfg.family} value={cfg.family} text={`${cfg.flag} ${cfg.label}`}>
          <span className={styles.option}>
            <FlagSign sign={cfg.flag} alt={cfg.label} />
            <span className={styles.label}>{cfg.label}</span>
            <span className={styles.code}>{cfg.family}</span>
          </span>
        </Option>
      ))}
    </Combobox>
  );
});
