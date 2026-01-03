import { FC } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface EmptySlotProps {
  date: string;
  label?: string;
}

export const EmptySlot: FC<EmptySlotProps> = ({ date, label }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: date,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-center justify-center
        min-h-[80px] p-4 rounded-lg border-2 border-dashed
        transition-all duration-200
        ${isOver 
          ? 'border-blue-400 bg-blue-50 scale-105' 
          : 'border-gray-300 bg-gray-50'
        }
      `}
    >
      <p className="text-sm text-gray-400">
        {isOver ? 'Drop task here' : label || 'Drop tasks here'}
      </p>
    </div>
  );
};
