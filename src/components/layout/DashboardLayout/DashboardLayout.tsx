// src/components/layout/DashboardLayout/DashboardLayout.tsx
import React from 'react';
import { RightSidebar } from '../shared/RightSidebar';
import { Header } from '../shared/Header';
import styles from './DashboardLayout.module.css';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.layoutContainer} dir="rtl">
      {/* هدر سرتاسری در بالا */}
      <Header />
      
      {/* محتوای پایین شامل سایدبار و بدنه اصلی */}
      <div className={styles.mainContent}>
        <RightSidebar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};
