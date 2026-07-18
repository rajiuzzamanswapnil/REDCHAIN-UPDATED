import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
