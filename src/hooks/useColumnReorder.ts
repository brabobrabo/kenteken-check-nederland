
import { useState, useEffect } from 'react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

export const useColumnReorder = (initialColumns: ColumnConfig[], storageKey: string) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedColumns = JSON.parse(saved);
        // Merge with initial columns to handle new columns
        const merged = initialColumns.map(initial => {
          const saved = savedColumns.find((s: ColumnConfig) => s.key === initial.key);
          return saved ? { ...initial, visible: saved.visible } : initial;
        });
        // Add any saved columns that might have different order
        const reordered = savedColumns
          .filter((saved: ColumnConfig) => merged.find(m => m.key === saved.key))
          .map((saved: ColumnConfig) => merged.find(m => m.key === saved.key)!);
        
        // Add any new columns that weren't in saved config
        const newColumns = merged.filter(m => !reordered.find(r => r.key === m.key));
        return [...reordered, ...newColumns];
      }
    } catch (error) {
      console.error('Error loading column config:', error);
    }
    return initialColumns;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  }, [columns, storageKey]);

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setColumns(newColumns);
  };

  const toggleColumnVisibility = (key: string) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ));
  };

  const resetColumns = () => {
    setColumns(initialColumns);
  };

  return {
    columns,
    moveColumn,
    toggleColumnVisibility,
    resetColumns,
    visibleColumns: columns.filter(col => col.visible)
  };
};
