// src/features/fem/section/FemSectionPreview.tsx

'use client';

import type {
  FemSectionDraft,
  FemSectionResolveIssue,
} from './femSection.types';
import styles from './FemSectionPreview.module.css';

type Props = {
  section: FemSectionDraft | null;
  issues?: FemSectionResolveIssue[];
  selected?: boolean;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
};

const VIEW_SIZE = 240;
const CENTER = VIEW_SIZE / 2;
const MAX_DRAW_SIZE = 160;

function formatNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function getScale(width: number, height: number) {
  const max = Math.max(width, height, 0.001);
  return MAX_DRAW_SIZE / max;
}

function SectionShape({ section }: { section: FemSectionDraft }) {
  const d = section.dimensions;

  if (section.kind === 'circular' || section.kind === 'cylinder') {
    const diameter = d.diameter ?? (d.radius ? d.radius * 2 : d.width);
    const radius = Math.max((diameter * getScale(diameter, diameter)) / 2, 8);

    return (
      <circle
        className={styles.shape}
        cx={CENTER}
        cy={CENTER}
        r={radius}
      />
    );
  }

  if (section.kind === 'box_culvert') {
    const width = Math.max(d.width, 0.001);
    const height = Math.max(d.height, 0.001);
    const scale = getScale(width, height);
    const outerWidth = width * scale;
    const outerHeight = height * scale;

    const thickness = Math.max(
      Math.min(
        (d.thickness ?? d.wallThickness ?? Math.min(width, height) * 0.08) *
          scale,
        outerWidth / 2 - 4,
        outerHeight / 2 - 4
      ),
      4
    );

    return (
      <>
        <rect
          className={styles.shape}
          x={CENTER - outerWidth / 2}
          y={CENTER - outerHeight / 2}
          width={outerWidth}
          height={outerHeight}
          rx={2}
        />

        <rect
          className={styles.shapeSecondary}
          x={CENTER - outerWidth / 2 + thickness}
          y={CENTER - outerHeight / 2 + thickness}
          width={Math.max(outerWidth - thickness * 2, 4)}
          height={Math.max(outerHeight - thickness * 2, 4)}
          rx={2}
        />
      </>
    );
  }

  if (section.kind === 'i_shape') {
    const width = Math.max(d.flangeWidth ?? d.width, 0.001);
    const height = Math.max(d.height, 0.001);
    const scale = getScale(width, height);

    const flangeWidth = width * scale;
    const totalHeight = height * scale;
    const flangeThickness = Math.max(
      (d.flangeThickness ?? height * 0.08) * scale,
      5
    );
    const webThickness = Math.max(
      (d.webThickness ?? width * 0.08) * scale,
      5
    );

    const x = CENTER - flangeWidth / 2;
    const y = CENTER - totalHeight / 2;

    return (
      <>
        <rect
          className={styles.shape}
          x={x}
          y={y}
          width={flangeWidth}
          height={flangeThickness}
          rx={1}
        />
        <rect
          className={styles.shape}
          x={CENTER - webThickness / 2}
          y={y + flangeThickness}
          width={webThickness}
          height={Math.max(totalHeight - flangeThickness * 2, 4)}
          rx={1}
        />
        <rect
          className={styles.shape}
          x={x}
          y={y + totalHeight - flangeThickness}
          width={flangeWidth}
          height={flangeThickness}
          rx={1}
        />
      </>
    );
  }

  const width = Math.max(d.width, 0.001);
  const height = Math.max(d.height, 0.001);
  const scale = getScale(width, height);

  return (
    <rect
      className={styles.shape}
      x={CENTER - (width * scale) / 2}
      y={CENTER - (height * scale) / 2}
      width={width * scale}
      height={height * scale}
      rx={3}
    />
  );
}

export default function FemSectionPreview({
  section,
  issues = [],
  selected = false,
  onPointerDown,
}: Props) {
  if (!section) {
    return (
      <div className={styles.empty}>
        مقطع FEM هنوز آماده نمایش نیست.
      </div>
    );
  }

  const d = section.dimensions;

  return (
    <div
      className={`${styles.sectionRoot} ${selected ? styles.selected : ''}`}
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
    >
      <div className={styles.inlineHeader}>
        <div className={styles.title}>{section.label}</div>
        <div className={styles.badge}>{section.kind}</div>
      </div>

      <div className={styles.inlineMeta}>
        <span>{formatNumber(d.width)} × {formatNumber(d.height)} {section.units}</span>
      </div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        role="img"
        aria-label="FEM section preview"
      >
        <line
          className={styles.axis}
          x1={CENTER}
          y1={16}
          x2={CENTER}
          y2={VIEW_SIZE - 16}
        />
        <line
          className={styles.axis}
          x1={16}
          y1={CENTER}
          x2={VIEW_SIZE - 16}
          y2={CENTER}
        />
        <SectionShape section={section} />
      </svg>

      {issues.length > 0 ? (
        <div className={styles.issueBadge}>
          {issues.length} issue
        </div>
      ) : null}
    </div>
  );
}
