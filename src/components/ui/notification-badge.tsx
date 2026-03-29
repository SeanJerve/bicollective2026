interface NotificationBadgeProps {
  count: number;
  className?: string;
  dot?: boolean;
}

const NotificationBadge = ({ count, className = "", dot = false }: NotificationBadgeProps) => {
  if (count <= 0) return null;

  if (dot) {
    return (
      <span
        className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border border-background shadow-sm ${className}`}
      />
    );
  }

  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 rounded-full ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default NotificationBadge;
