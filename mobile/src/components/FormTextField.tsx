import React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { TextField } from './TextField';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  secureTextEntry?: boolean;
};

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  autoCapitalize,
  keyboardType,
  secureTextEntry,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <TextField
          label={label}
          value={String(value ?? '')}
          onChangeText={onChange}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          error={error?.message}
        />
      )}
    />
  );
}

