import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableItem({
  id,
  label,
  darkMode,
  children,
}: {
  id: number;
  label: string;
  darkMode: boolean;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-grab ${
        darkMode
          ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
          : "bg-white border-gray-300 hover:bg-gray-100"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      {children}
    </li>
  );
}
