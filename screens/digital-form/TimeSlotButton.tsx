// components/digital-form/TimeSlotButton.tsx
"use client"

interface TimeSlotButtonProps {
    label: string;
    quantity: number;
    isCurrentSlot?: boolean;
    onClick: () => void;
}

export default function TimeSlotButton({
    label,
    quantity,
    isCurrentSlot = false,
    onClick
}: TimeSlotButtonProps) {
    return (
        <button
            className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
        ${quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
        ${isCurrentSlot ? 'ring-2 ring-blue-500' : ''}
        hover:bg-gray-200 transition-colors
      `}
            onClick={onClick}
            aria-label={`Time slot ${label}: ${quantity}`}
        >
            {quantity}
        </button>
    );
}