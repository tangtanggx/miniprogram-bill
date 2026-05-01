import React from 'react';
import { DatePicker } from 'antd-mobile';
import dayjs from 'dayjs';
import './DateSelector.css';

interface DateSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
  precision?: 'year' | 'month' | 'day' | 'hour' | 'minute';
  label?: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  onChange,
  precision = 'day',
  label = '选择日期',
}) => {
  return (
    <div className="date-selector">
      <DatePicker
        precision={precision}
        value={value}
        onConfirm={(val) => onChange(val as unknown as Date)}
        title={label}
      >
        {(_items, actions) => (
          <div className="date-selector-trigger" onClick={() => actions.open()}>
            <span className="date-selector-icon">📅</span>
            <span className="date-selector-value">
              {dayjs(value).format('YYYY-MM-DD')}
            </span>
          </div>
        )}
      </DatePicker>
    </div>
  );
};

export default DateSelector;
