import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";

type AppRow = {
  id: string;
  title: string;
  iconUrl: string;
  publicUrl: string;
  pingUrl: string | null;
  sortOrder: number;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm";

function SortableAppRow({
  app,
  editingId,
  onEdit,
  onCancelEdit,
  onMessage,
  onRefresh,
}: {
  app: AppRow;
  editingId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onMessage: (msg: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === app.id;

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="p-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const res = await fetch(`/api/admin/apps/${app.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                title: form.get("title"),
                iconUrl: form.get("iconUrl"),
                publicUrl: form.get("publicUrl"),
                pingUrl: form.get("pingUrl") || "",
              }),
            });
            const result = await res.json();
            onMessage(result.error ?? "App updated");
            onCancelEdit();
            await onRefresh();
          }}
          className="grid gap-3 md:grid-cols-2"
        >
          <input
            name="title"
            defaultValue={app.title}
            required
            className={inputClass}
          />
          <input
            name="iconUrl"
            defaultValue={app.iconUrl}
            required
            className={inputClass}
          />
          <input
            name="publicUrl"
            defaultValue={app.publicUrl}
            required
            className={inputClass}
          />
          <input
            name="pingUrl"
            defaultValue={app.pingUrl ?? ""}
            placeholder="Ping URL (optional)"
            className={inputClass}
          />
          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              className="rounded border border-border px-4 py-2 font-console text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded border border-border px-4 py-2 font-console text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-4 p-4"
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none font-console text-xs text-muted active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{app.title}</p>
        <p className="truncate font-console text-xs text-muted">
          {app.publicUrl}
        </p>
      </div>
      <div className="flex shrink-0 gap-3 font-console text-xs">
        <button
          type="button"
          onClick={() => onEdit(app.id)}
          className="text-muted"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={async () => {
            await fetch(`/api/admin/apps/${app.id}`, {
              method: "DELETE",
              credentials: "include",
            });
            await onRefresh();
          }}
          className="text-status-down"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function SortableAppList({
  apps: initialApps,
  onMessage,
  onRefresh,
}: {
  apps: AppRow[];
  onMessage: (msg: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [items, setItems] = useState(initialApps);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialApps);
  }, [initialApps]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);

    const res = await fetch("/api/admin/apps/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderedIds: reordered.map((item) => item.id) }),
    });
    const result = await res.json();
    if (result.error) {
      onMessage(result.error);
      setItems(initialApps);
    } else {
      await onRefresh();
    }
  }

  if (items.length === 0) {
    return (
      <p className="p-4 font-console text-sm text-muted">No apps yet.</p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((app) => (
          <SortableAppRow
            key={app.id}
            app={app}
            editingId={editingId}
            onEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            onMessage={onMessage}
            onRefresh={onRefresh}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
