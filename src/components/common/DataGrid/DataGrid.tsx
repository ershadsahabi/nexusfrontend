// NexusProject\nexus-frontend\src\components\common\DataGrid\DataGrid.tsx

import React from 'react';
import styles from './DataGrid.module.css';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  keyExtractor: (row: T) => string | number;
}

export function DataGrid<T>({
  data,
  columns,
  isLoading,
  keyExtractor,
}: DataGridProps<T>) {
  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <span>در حال بارگذاری داده‌ها...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.stateBox}>
        <div className={styles.emptyIcon} aria-hidden="true">
          —
        </div>
        <span>داده‌ای یافت نشد.</span>
      </div>
    );
  }

  return (
    <div className={styles.tableShell}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={keyExtractor(row)}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
