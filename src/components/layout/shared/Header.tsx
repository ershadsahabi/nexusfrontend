'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { useLogout } from '@/hooks/useLogout';
import { useWorkspaceHeaderContext } from '@/hooks/useWorkspaceHeaderContext';
import styles from './SharedLayout.module.css';

type HeaderTone = 'cyan' | 'green' | 'violet' | 'amber';

type HeaderContext = {
  title: string;
  subtitle: string;
  mode: string;
  tone: HeaderTone;
  code: string;
  routeKey: 'workspace' | 'dashboard' | 'projects' | 'settings' | 'system';
  quickMetrics?: {
    primaryLabel: string;
    primaryValue: string;
    secondaryLabel: string;
    secondaryValue: string;
  };
};

type HeaderProps = {
  projectUuid?: string;
  scenarioId?: string;
};

const getHeaderContext = (pathname: string | null): HeaderContext => {
  if (!pathname) {
    return {
      title: 'Nexus Engine',
      subtitle: 'Unified engineering control surface',
      mode: 'System Mode',
      tone: 'cyan',
      code: 'SYS',
      routeKey: 'system',
      quickMetrics: {
        primaryLabel: 'Kernel',
        primaryValue: 'Online',
        secondaryLabel: 'Mode',
        secondaryValue: 'Core',
      },
    };
  }

  if (pathname === '/workspace' || pathname.startsWith('/workspace/')) {
    return {
      title: 'Graph Workspace',
      subtitle: 'محیط مدل‌سازی، ساختاردهی و شبیه‌سازی سیستم',
      mode: 'Engineering Mode',
      tone: 'cyan',
      code: 'GX',
      routeKey: 'workspace',
      quickMetrics: {
        primaryLabel: 'Canvas',
        primaryValue: 'Ready',
        secondaryLabel: 'Mode',
        secondaryValue: 'Graph',
      },
    };
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return {
      title: 'Dashboard',
      subtitle: 'نمای پایش، وضعیت و کنترل سامانه',
      mode: 'Monitoring Mode',
      tone: 'green',
      code: 'DB',
      routeKey: 'dashboard',
      quickMetrics: {
        primaryLabel: 'State',
        primaryValue: 'Online',
        secondaryLabel: 'Feed',
        secondaryValue: 'Live',
      },
    };
  }

  if (pathname === '/projects' || pathname.startsWith('/projects/')) {
    return {
      title: 'Projects',
      subtitle: 'مدیریت پروژه‌ها، ساختارها و منابع',
      mode: 'Project Mode',
      tone: 'violet',
      code: 'PR',
      routeKey: 'projects',
      quickMetrics: {
        primaryLabel: 'Scope',
        primaryValue: 'Active',
        secondaryLabel: 'Assets',
        secondaryValue: 'Managed',
      },
    };
  }

  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return {
      title: 'Settings',
      subtitle: 'پیکربندی هسته و تنظیمات محیط',
      mode: 'Configuration Mode',
      tone: 'amber',
      code: 'CFG',
      routeKey: 'settings',
      quickMetrics: {
        primaryLabel: 'Profile',
        primaryValue: 'Loaded',
        secondaryLabel: 'Access',
        secondaryValue: 'Secure',
      },
    };
  }

  return {
    title: 'Nexus Engine',
    subtitle: 'Unified engineering control surface',
    mode: 'System Mode',
    tone: 'cyan',
    code: 'SYS',
    routeKey: 'system',
    quickMetrics: {
      primaryLabel: 'Kernel',
      primaryValue: 'Online',
      secondaryLabel: 'Mode',
      secondaryValue: 'Core',
    },
  };
};

const toneClassMap: Record<HeaderTone, string> = {
  cyan: styles.modeCyan,
  green: styles.modeGreen,
  violet: styles.modeViolet,
  amber: styles.modeAmber,
};

const LogoutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const Header = ({ projectUuid, scenarioId }: HeaderProps) => {
  const pathname = usePathname();
  const logout = useLogout();

  const workspaceContext = useWorkspaceHeaderContext({
    projectUuid,
    scenarioId,
  });

  const context = useMemo(() => getHeaderContext(pathname), [pathname]);

  const isWorkspace = context.routeKey === 'workspace';
  const isDashboard = context.routeKey === 'dashboard';

  const workspaceProjectLabel = workspaceContext.isLoading
    ? 'Loading project...'
    : workspaceContext.projectName ?? 'Unnamed Project';

  const workspaceScenarioLabel = workspaceContext.isLoading
    ? 'Loading scenario...'
    : workspaceContext.scenarioName ?? 'Unnamed Scenario';

  const workspaceProjectTitle =
    workspaceContext.projectUuid ?? workspaceProjectLabel;

  const workspaceScenarioTitle =
    workspaceContext.scenarioId ?? workspaceScenarioLabel;

  return (
    <header className={styles.header} dir="rtl">
      <div className={styles.headerGrid}>
        <div className={styles.headerBrand}>
          <Link
            href="/dashboard"
            className={styles.brandAnchor}
            aria-label="Go to dashboard"
          >
            <div className={styles.logoMark}>NX</div>

            <div className={styles.brandText}>
              <span className={styles.logo}>NEXUS ENGINE</span>

              <div className={styles.logoSubtitle}>
                <span>v3.0 // AI Systems Modeling</span>

                <span className={styles.sectionChip}>
                  <span className={styles.sectionChipCode}>
                    {context.code}
                  </span>
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.headerContextCard}>
            <div className={styles.headerContextText}>
              <span className={styles.contextEyebrow}>
                {isWorkspace
                  ? 'Active Workspace Context'
                  : isDashboard
                    ? 'Live System Context'
                    : 'Active Context'}
              </span>

              <strong className={styles.contextTitle}>{context.title}</strong>

              <span className={styles.contextSubtitle}>
                {context.subtitle}
              </span>
            </div>

            <div
              className={`${styles.modeBadge} ${toneClassMap[context.tone]}`}
            >
              <span className={styles.modeBadgeDot} />
              <span>{context.mode}</span>
            </div>
          </div>
        </div>

        <div className={styles.userActions}>
          {isWorkspace ? (
            <div
              className={styles.workspaceQuickState}
              aria-label="Current workspace project and scenario"
            >
              <div className={styles.quickStateItem}>
                <span className={styles.quickStateLabel}>Project</span>

                <span
                  className={styles.quickStateValue}
                  title={workspaceProjectTitle}
                  dir="ltr"
                >
                  {workspaceProjectLabel}
                </span>

              </div>

              <span className={styles.quickStateDivider} />

              <div className={styles.quickStateItem}>
                <span className={styles.quickStateLabel}>Scenario</span>

                <span
                  className={styles.quickStateValue}
                  title={workspaceScenarioTitle}
                  dir="ltr"
                >
                  {workspaceScenarioLabel}
                </span>

              </div>
            </div>
          ) : context.quickMetrics ? (
            <div
              className={styles.workspaceQuickState}
              aria-label="Current route quick state"
            >
              <div className={styles.quickStateItem}>
                <span className={styles.quickStateLabel}>
                  {context.quickMetrics.primaryLabel}
                </span>

                <span className={styles.quickStateValue}>
                  {context.quickMetrics.primaryValue}
                </span>
              </div>

              <span className={styles.quickStateDivider} />

              <div className={styles.quickStateItem}>
                <span className={styles.quickStateLabel}>
                  {context.quickMetrics.secondaryLabel}
                </span>

                <span className={styles.quickStateValue}>
                  {context.quickMetrics.secondaryValue}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.statusBadge}>
              <span className={styles.statusDot} />
              SYSTEM ONLINE
            </div>
          )}

          <div className={styles.userInfo}>
            <span className={styles.userName}>Administrator</span>
            <span className={styles.userRole}>SEC-LEVEL 4</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className={styles.logoutBtn}
            aria-label="Logout"
            title="Logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  );
};
