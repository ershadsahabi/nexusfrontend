
// src/components/common/FloatingPanel/FloatingPanel.tsx

'use client';

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react';
import { cloneElement, isValidElement, useEffect, useLayoutEffect, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import styles from './FloatingPanel.module.css';

type FloatingPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  children: ReactNode;
  placement?: Placement;
  offsetValue?: number;
  className?: string;
  panelStyle?: CSSProperties;
  matchTriggerWidth?: boolean;
  zIndex?: number;
};

export default function FloatingPanel({
  open,
  onOpenChange,
  trigger,
  children,
  placement = 'bottom-start',
  offsetValue = 8,
  className,
  panelStyle,
  matchTriggerWidth = false,
  zIndex = 4000,
}: FloatingPanelProps) {
  const [isReady, setIsReady] = useState(false);

  const { refs, floatingStyles, context, update } = useFloating({
    open,
    onOpenChange,
    placement,
    middleware: [
      offset(offsetValue),
      flip({ padding: 12 }),
      shift({ padding: 12 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context, {
    event: 'mousedown',
    toggle: true,
  });

  const dismiss = useDismiss(context, {
    outsidePress: true,
    escapeKey: true,
  });

  const role = useRole(context, {
    role: 'menu',
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  useEffect(() => {
    if (!open) {
      setIsReady(false);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    let frame = 0;
    let cancelled = false;

    const prepare = async () => {
      await update();
      if (cancelled) return;

      frame = requestAnimationFrame(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });
    };

    prepare();

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
    };
  }, [open, update]);

  const reference = isValidElement(trigger)
    ? cloneElement(trigger, {
        ref: refs.setReference,
        ...getReferenceProps({
          ...(trigger.props ?? {}),
          'aria-expanded': open,
        }),
      })
    : trigger;

  return (
    <>
      {reference}

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex,
              width: matchTriggerWidth
                ? refs.reference.current?.getBoundingClientRect().width
                : undefined,
              visibility: isReady ? 'visible' : 'hidden',
              pointerEvents: isReady ? 'auto' : 'none',
            }}
            {...getFloatingProps()}
          >
            <div
              className={`${styles.panelInner} ${isReady ? styles.panelInnerReady : ''} ${className ?? ''}`}
              style={panelStyle}
            >
              {children}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
