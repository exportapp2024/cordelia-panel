import React from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

interface PhoneInputFieldProps {
  value: string;
  onChange: (phone: string) => void;
  defaultCountry?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  variant?: 'default' | 'inline';
  onBlur?: () => void;
  inputProps?: {
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  };
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value,
  onChange,
  defaultCountry = 'tr',
  disabled = false,
  className,
  inputClassName,
  variant = 'default',
  onBlur,
  inputProps,
}) => {
  // Default styling for standard form inputs
  const defaultInputClassName = variant === 'default'
    ? 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 group-focus:ring-2 group-focus:ring-emerald-500 group-focus:border-emerald-500'
    : 'px-1 border-0 border-b border-emerald-500 rounded-none focus:outline-none focus:ring-0 focus:border-emerald-500 text-sm bg-transparent group-focus:ring-2 group-focus:ring-emerald-500 group-focus:border-emerald-500';

  const defaultClassName = variant === 'default' ? 'w-full group' : 'group';

  return (
    <PhoneInput
      defaultCountry={defaultCountry}
      value={value}
      onChange={onChange}
      className={className || defaultClassName}
      inputClassName={inputClassName || defaultInputClassName}
      countrySelectorStyleProps={{
        buttonClassName: 'border-gray-300 group-focus:ring-2 group-focus:ring-emerald-500 group-focus:border-emerald-500 transition-all',
        flagStyle: { paddingLeft: '8px' }
      }}
      disabled={disabled}
      onBlur={onBlur}
      inputProps={inputProps}
    />
  );
};

