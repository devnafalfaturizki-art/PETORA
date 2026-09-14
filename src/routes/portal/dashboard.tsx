import { type Component } from 'solid-js';
import { useAuthStore } from '@/stores/auth.store';

export const PortalDashboard: Component = () => {
  const { user } = useAuthStore();
  const displayName = user()?.full_name ?? 'Guest';

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Dashboard Customer</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Selamat datang, {displayName}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-border bg-background p-4">
          <h3 class="text-sm font-medium text-muted-foreground">Hewan Peliharaan</h3>
          <p class="text-2xl font-bold text-foreground mt-2">0</p>
          <p class="text-xs text-muted-foreground mt-1">tersedia</p>
        </div>
        <div class="rounded-lg border border-border bg-background p-4">
          <h3 class="text-sm font-medium text-muted-foreground">Janji Temu Mendatang</h3>
          <p class="text-2xl font-bold text-foreground mt-2">0</p>
          <p class="text-xs text-muted-foreground mt-1">janji temu</p>
        </div>
        <div class="rounded-lg border border-border bg-background p-4">
          <h3 class="text-sm font-medium text-muted-foreground">Poin Loyalty</h3>
          <p class="text-2xl font-bold text-foreground mt-2">0</p>
          <p class="text-xs text-muted-foreground mt-1">poin tersedia</p>
        </div>
        <div class="rounded-lg border border-border bg-background p-4">
          <h3 class="text-sm font-medium text-muted-foreground">Tagihan Belum Dibayar</h3>
          <p class="text-2xl font-bold text-foreground mt-2">Rp0</p>
          <p class="text-xs text-muted-foreground mt-1">jumlah tagihan</p>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
