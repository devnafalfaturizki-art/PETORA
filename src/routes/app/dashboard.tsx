import { type Component } from 'solid-js';
import { useAuthStore } from '@/stores/auth.store';
import { USER_ROLE_LABELS } from '@/lib/constants';
import { CalendarCheck, Users, ShoppingBag, Receipt, BarChart3 } from 'lucide-solid';

export const Dashboard: Component = () => {
  const { user, role } = useAuthStore();
  const currentRole = role() ?? '';

  const quickActions = [
    { label: 'Janji Temu', icon: CalendarCheck, path: '/app/appointments', roles: ['OWNER', 'ADMIN', 'DOKTER'] },
    { label: 'Customer', icon: Users, path: '/app/crm/customers', roles: ['OWNER', 'ADMIN', 'DOKTER', 'KASIR'] },
    { label: 'POS', icon: Receipt, path: '/app/pos', roles: ['OWNER', 'ADMIN', 'KASIR'] },
    { label: 'Produk', icon: ShoppingBag, path: '/app/products', roles: ['OWNER', 'ADMIN', 'KASIR'] },
    { label: 'Laporan', icon: BarChart3, path: '/app/reports/revenue', roles: ['OWNER', 'ADMIN'] },
  ];

  const visibleActions = quickActions.filter((action) =>
    action.roles.includes(currentRole)
  );

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Selamat datang, {user()?.full_name ?? 'Guest'} ({USER_ROLE_LABELS[currentRole] ?? currentRole})
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <a
              href={action.path}
              class="flex flex-col items-center justify-center rounded-lg border border-border bg-background p-4 text-center transition-all hover:border-primary hover:bg-muted/50"
            >
              <Icon class="h-6 w-6 text-primary mb-2" />
              <span class="text-sm font-medium text-foreground">{action.label}</span>
            </a>
          );
        })}
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-lg border border-border bg-background p-4">
          <h3 class="text-sm font-medium text-muted-foreground">Janji Temu Hari Ini</h3>
          <p class="text-2xl font-bold text-foreground mt-2">0</p>
          <p class="text-xs text-muted-foreground mt-1">belum dimulai</p>
        </div>
        <div class="rounded-lg border border-border bg-background p-4">
          <h3 class="text-sm font-medium text-muted-foreground">Produk Stok Rendah</h3>
          <p class="text-2xl font-bold text-foreground mt-2">0</p>
          <p class="text-xs text-muted-foreground mt-1">perlu restock</p>
        </div>
        <div class="rounded-lg border border-border bg-background p-4">
          <h3 class="text-sm font-medium text-muted-foreground">Penjualan Hari Ini</h3>
          <p class="text-2xl font-bold text-foreground mt-2">Rp0</p>
          <p class="text-xs text-muted-foreground mt-1">omset</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
