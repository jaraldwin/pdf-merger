"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableItem({
  id,
  label,
  darkMode,
}: {
  id: number;
  label: string;
  darkMode: boolean;
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
      className={`p-3 rounded-lg font-medium cursor-grab active:cursor-grabbing ${
        darkMode
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-white hover:bg-gray-100 border border-gray-300"
      }`}
    >
      {label}
    </li>
  );
}
