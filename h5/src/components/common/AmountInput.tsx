import React from 'react';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = '0.00',
  autoFocus = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    const num = parseFloat(raw);
    onChange(isNaN(num) ? 0 : num);
  };

  const displayValue = value > 0 ? value.toFixed(2) : '';

  return (
    <div className="amount-input-wrapper">
      <span className="amount-currency">¥</span>
      <input
        type="text"
        className="amount-input-field"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default AmountInput;
