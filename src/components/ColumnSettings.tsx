
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, GripVertical, RotateCcw } from 'lucide-react';
import { ColumnConfig } from '@/hooks/useColumnReorder';

interface ColumnSettingsProps {
  columns: ColumnConfig[];
  onMoveColumn: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (key: string) => void;
  onReset: () => void;
}

export const ColumnSettings: React.FC<ColumnSettingsProps> = ({
  columns,
  onMoveColumn,
  onToggleVisibility,
  onReset
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onMoveColumn(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Settings className="h-3 w-3 mr-1" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white border shadow-lg z-50" align="start">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">Column Settings</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {columns.map((column, index) => (
              <div
                key={column.key}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center space-x-2 p-2 rounded border cursor-move hover:bg-gray-50 ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => onToggleVisibility(column.key)}
                />
                <span className="text-sm flex-1">{column.label}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
