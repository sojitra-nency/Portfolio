'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SKILL_CATEGORY_COLORS } from './skillCloudConstants';

interface Category {
  id: string;
  label: string;
}

interface CategoryFilterBarProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (id: string | null) => void;
}

export default function CategoryFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterBarProps) {
  const allItems = [{ id: null as string | null, label: 'All' }, ...categories];

  return (
    <div className="overflow-x-auto scrollbar-none mb-6 -mx-2 px-2">
      <div className="flex gap-2 justify-center min-w-max mx-auto">
        {allItems.map((item) => {
          const isActive = activeCategory === item.id;
          const isAll = item.id === null;
          const color = isAll
            ? null
            : SKILL_CATEGORY_COLORS[item.id!] || '#fff';

          const activeColor = isAll ? 'rgba(255,255,255,0.9)' : color!;
          const textColor = isActive ? '#0a0a0f' : (color || 'rgba(255,255,255,0.7)');
          const bgColor = isActive
            ? activeColor
            : isAll
              ? 'rgba(255,255,255,0.05)'
              : `${color}08`;
          const borderColor = isActive
            ? activeColor
            : isAll
              ? 'rgba(255,255,255,0.2)'
              : `${color}30`;

          return (
            <motion.button
              key={item.id ?? 'all'}
              onClick={() => onCategoryChange(item.id)}
              className="relative rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer"
              style={{
                color: textColor,
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
              }}
              animate={{
                scale: isActive ? 1 : 1,
                boxShadow: isActive
                  ? `0 0 16px ${activeColor}40, 0 0 4px ${activeColor}30`
                  : '0 0 0px transparent',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              layout
            >
              {/* Animated active background pill */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: activeColor }}
                    layoutId="active-filter-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
