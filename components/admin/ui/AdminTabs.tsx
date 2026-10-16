'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { type LucideIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAdminT } from '@/lib/admin-i18n';

export interface AdminTabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export interface AdminTabsProps {
  tabs: AdminTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function AdminTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: AdminTabsProps) {
  const { tx, isAr } = useAdminT();
  const isRtl = isAr;
  const StartIcon = isRtl ? ChevronRight : ChevronLeft;
  const EndIcon = isRtl ? ChevronLeft : ChevronRight;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Drag-to-scroll state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasMoved = useRef(false);

  // Check and update scroll boundaries
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflowing = scrollWidth > clientWidth + 2;
    setIsOverflowing(overflowing);

    if (!overflowing) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }

    const isRtl = document.dir === 'rtl' || el.closest('[dir="rtl"]') !== null;
    const maxScroll = scrollWidth - clientWidth;

    if (isRtl) {
      // Modern Chromium/Firefox RTL: scrollLeft <= 0 (0 is rightmost start)
      // Some engines use positive 0 to maxScroll. We support both.
      const absScroll = Math.abs(scrollLeft);
      setCanScrollStart(absScroll > 5);
      setCanScrollEnd(absScroll < maxScroll - 5);
    } else {
      setCanScrollStart(scrollLeft > 5);
      setCanScrollEnd(scrollLeft < maxScroll - 5);
    }
  }, []);

  useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => updateScrollState();
    el.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', updateScrollState);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, tabs]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>('.admin-tab-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTab]);

  // Scroll in direction
  const scrollDirection = (direction: 'next' | 'prev') => {
    const el = scrollRef.current;
    if (!el) return;

    const isRtl = document.dir === 'rtl' || el.closest('[dir="rtl"]') !== null;
    const scrollAmount = 260;

    let delta = 0;
    if (direction === 'next') {
      // In RTL, moving to later tabs means scrolling to the LEFT (negative delta in CSSOM)
      delta = isRtl ? -scrollAmount : scrollAmount;
    } else {
      // In RTL, moving back to initial tabs means scrolling to the RIGHT (positive delta in CSSOM)
      delta = isRtl ? scrollAmount : -scrollAmount;
    }

    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Convert mouse wheel vertically into horizontal tab scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !isOverflowing) return;

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const isRtl = document.dir === 'rtl' || el.closest('[dir="rtl"]') !== null;
      const scrollStep = isRtl ? -e.deltaY : e.deltaY;
      el.scrollLeft += scrollStep;
    }
  };

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - el.offsetLeft;
    scrollStart.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.4;
    if (Math.abs(walk) > 4) {
      hasMoved.current = true;
    }
    scrollRef.current.scrollLeft = scrollStart.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className={`admin-tabs-wrapper ${className}`}>
      <div className="admin-tabs-scroll-container">
        {/* Navigation Button: Previous (Start / Right in RTL, Left in LTR) */}
        {isOverflowing && (
          <button
            type="button"
            className="admin-tabs-nav-btn admin-tabs-nav-prev"
            disabled={!canScrollStart}
            onClick={() => scrollDirection('prev')}
            title={tx("التمرير للبداية")}
            aria-label={tx("التمرير للبداية")}
          >
            <StartIcon size={18} />
          </button>
        )}

        {/* Scrollable Tabs Track */}
        <div
          ref={scrollRef}
          className="admin-tabs"
          role="tablist"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isOverflowing ? 'grab' : 'default' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`admin-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!hasMoved.current) {
                    onChange(tab.id);
                  }
                }}
              >
                {Icon && <Icon size={16} />}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className="admin-tab-badge">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Button: Next (End / Left in RTL, Right in LTR) */}
        {isOverflowing && (
          <button
            type="button"
            className="admin-tabs-nav-btn admin-tabs-nav-next"
            disabled={!canScrollEnd}
            onClick={() => scrollDirection('next')}
            title={tx("التمرير للمزيد من التبويبات")}
            aria-label={tx("التمرير للمزيد من التبويبات")}
          >
            <EndIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
