import { type Component, splitProps } from "solid-js";
import type { StatusBadgeProps } from "@/components/ui/types";
import { Badge } from "@/components/ui/badge";

const statusColorMap: Record<
  string,
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "muted"
> = {
  WAITING: "warning",
  IN_PROGRESS: "info",
  DONE: "success",
  CANCELLED: "destructive",
  UNPAID: "warning",
  PARTIAL_PAYMENT: "info",
  PAID: "success",
  AVAILABLE: "success",
  RESERVED: "warning",
  OCCUPIED: "info",
  MAINTENANCE: "destructive",
  INACTIVE: "muted",
  ACTIVE: "success",
  ARCHIVED: "muted",
  BOOKED: "info",
  CHECKED_IN: "warning",
  CHECKED_OUT: "success",
  DRAFT: "muted",
  SENT: "info",
  RECEIVED: "success",
  OPEN: "info",
  CLOSED: "success",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  REVERSED: "destructive",
};

export const StatusBadge: Component<StatusBadgeProps> = (props) => {
  const [local] = splitProps(props, ["status", "variant", "class"]);
  const variant = local.variant ?? statusColorMap[local.status] ?? "default";

  return (
    <Badge variant={variant} class={local.class ?? ""}>
      {local.status}
    </Badge>
  );
};

export default StatusBadge;
