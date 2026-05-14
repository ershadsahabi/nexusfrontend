// components/common/Textarea/Textarea.tsx


'use client';

import React from 'react';
import styles from './Textarea.module.css';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export default function Textarea({
  invalid = false,
  className = '',
  ...props
}: Props) {
  return (
    <textarea
      className={[styles.textarea, invalid ? styles.invalid : '', className].join(' ')}
      {...props}
    />
  );
}
