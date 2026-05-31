import { Inbox } from "lucide-react";

function EmptyState({ title, message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-dashed border-zinc-300 bg-white p-8 text-center">
      <Inbox className="mb-3 text-zinc-400" size={28} aria-hidden="true" />
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-600">{message}</p>
    </div>
  );
}

export default EmptyState;
