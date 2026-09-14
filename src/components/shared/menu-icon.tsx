import { type Component } from "solid-js";
import type { LucideProps } from "lucide-solid";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  Hotel,
  Scissors,
  Package,
  Store,
  BarChart3,
  Gift,
  Wallet,
  Settings,
  PawPrint,
  ShoppingBag,
  Receipt,
  TrendingUp,
  PieChart,
  FileText,
  Layers,
  CreditCard,
  UserCheck,
  Shield,
  Bell,
  Calendar,
  Clock,
  Hash,
  PackageCheck,
  ShoppingCart,
  ReceiptText,
  FileBarChart2,
  FileInput,
  HelpCircle,
} from "lucide-solid";

const iconRegistry: Record<string, Component<LucideProps>> = {
  "layout-dashboard": LayoutDashboard,
  dashboard: LayoutDashboard,
  users: Users,
  "calendar-check": CalendarCheck,
  "clipboard-x": ClipboardList,
  clipboard: ClipboardList,
  "clipboard-list": ClipboardList,
  hotel: Hotel,
  "pet-hotel": Hotel,
  scissors: Scissors,
  grooming: Scissors,
  package: Package,
  products: Package,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  store: Store,
  pos: Store,
  "chart-bar": BarChart3,
  "file-bar-chart-2": FileBarChart2,
  gift: Gift,
  loyalty: Gift,
  wallet: Wallet,
  keuangan: Wallet,
  expenses: Wallet,
  settings: Settings,
  "paw-print": PawPrint,
  receipt: Receipt,
  invoices: Receipt,
  "receipt-text": ReceiptText,
  "trending-up": TrendingUp,
  revenue: TrendingUp,
  "trending-down": TrendingUp,
  pnl: PieChart,
  "pie-chart": PieChart,
  "file-text": FileText,
  layers: Layers,
  "credit-card": CreditCard,
  banknote: CreditCard,
  "user-check": UserCheck,
  shield: Shield,
  bell: Bell,
  calendar: Calendar,
  clock: Clock,
  hash: Hash,
  "package-check": PackageCheck,
  "file-input": FileInput,
  "help-circle": HelpCircle,
};

export interface MenuIconProps {
  name: string;
  class?: string;
}

export const MenuIcon: Component<MenuIconProps> = (props) => {
  const Icon = iconRegistry[props.name] ?? HelpCircle;
  return <Icon class={props.class ?? "h-4 w-4"} />;
};

export function getIconComponent(name: string): Component<LucideProps> {
  return iconRegistry[name] ?? HelpCircle;
}

export default MenuIcon;
