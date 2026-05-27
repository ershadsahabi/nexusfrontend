// src/app/(dashboard)/dashboard/page.tsx
import React from 'react';
import { Card, SectionHeader, Badge, Button } from '@/components/common';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      {/* هدر صفحه با استفاده از کامپوننت مشترک */}
      <SectionHeader 
        title="داشبورد اصلی" 
        subtitle="خوش آمدید! در اینجا می‌توانید نمای کلی سیستم خود را مشاهده کنید."
      />

      {/* شبکه کارت‌های آماری */}
      <div className={styles.statsGrid}>
        <Card title="پروژه‌های فعال">
          <div className={styles.statContent}>
            <span className={styles.statValue}>۱۲</span>
            <Badge variant="success" subtle>+۲ این هفته</Badge>
          </div>
        </Card>

        <Card title="کاربران سیستم">
          <div className={styles.statContent}>
            <span className={styles.statValue}>۴۵</span>
            <Badge variant="info" subtle>کاربر فعال</Badge>
          </div>
        </Card>

        <Card title="فضای مصرف شده">
          <div className={styles.statContent}>
            <span className={styles.statValue}>%۶۰</span>
            <Badge variant="warning" subtle>نیاز به بررسی</Badge>
          </div>
        </Card>
      </div>

      {/* بخش فعالیت‌های اخیر */}
      <div className={styles.recentSection}>
        <Card 
          title="آخرین فعالیت‌ها" 
          actions={
            <Button variant="primary" size="sm">
              مشاهده همه گزارش‌ها
            </Button>
          }
        >
          <p className={styles.emptyText}>
            هیچ فعالیت جدیدی در ۲۴ ساعت گذشته در سیستم ثبت نشده است.
          </p>
        </Card>
      </div>
    </div>
  );
}
