// components/common/Card/Card.tsx


import React from 'react';
import styles from './Card.module.css';

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: Props) {
  return (
    <section className={[styles.card, className].join(' ')}>
      {(title || subtitle || actions) && (
        <header className={styles.header}>
          <div className={styles.headText}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>

          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}

      <div className={styles.body}>{children}</div>
    </section>
  );
}
