export const APP_NAME = 'Petora';
export const APP_VERSION = '1.0.0';

export const PIN_LENGTH = 6;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

export const LOW_STOCK_THRESHOLD = 5;
export const LOYALTY_POINT_VALUE = 100;
export const MIN_TRANSACTION_FOR_POINTS = 10000;

export const DEFAULT_TIMEZONE = 'Asia/Jakarta';
export const CURRENCY = 'IDR';

export const OPERATING_HOURS = {
  open: '08:00',
  close: '20:00',
};

export const PAGE_LIMIT_DEFAULT = 20;
export const PAGE_LIMIT_OPTIONS = [10, 20, 50, 100] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  DOKTER: 'Dokter',
  KASIR: 'Kasir',
  CUSTOMER: 'Customer',
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  WAITING: 'Menunggu',
  IN_PROGRESS: 'Dalam Proses',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  WAITING: 'warning',
  IN_PROGRESS: 'info',
  DONE: 'success',
  CANCELLED: 'error',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Belum Bayar',
  PARTIAL_PAYMENT: 'Cicilan',
  PAID: 'Lunas',
  CANCELLED: 'Dibatalkan',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'warning',
  PARTIAL_PAYMENT: 'info',
  PAID: 'success',
  CANCELLED: 'error',
};

export const ROOM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Tersedia',
  RESERVED: 'Direservasi',
  OCCUPIED: 'Terisi',
  MAINTENANCE: 'Maintenance',
  INACTIVE: 'Non-aktif',
};

export const ROOM_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  OCCUPIED: 'info',
  MAINTENANCE: 'error',
  INACTIVE: 'muted',
};

export const GROOMING_STATUS_LABELS: Record<string, string> = {
  BOOKED: 'Dipesan',
  IN_PROGRESS: 'Dalam Proses',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const GROOMING_STATUS_COLORS: Record<string, string> = {
  BOOKED: 'info',
  IN_PROGRESS: 'warning',
  DONE: 'success',
  CANCELLED: 'error',
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif',
  ARCHIVED: 'Diarsipkan',
};

export const PET_HOTEL_BOOKING_STATUS_LABELS: Record<string, string> = {
  BOOKED: 'Dipesan',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Dibatalkan',
};

export const PET_HOTEL_BOOKING_STATUS_COLORS: Record<string, string> = {
  BOOKED: 'info',
  CHECKED_IN: 'warning',
  CHECKED_OUT: 'success',
  CANCELLED: 'error',
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Masuk',
  OUT: 'Keluar',
  RETURN: 'Retur',
  ADJUSTMENT: 'Penyesuaian',
  DAMAGED: 'Rusak',
  EXPIRED: 'Kedaluwarsi',
  OPNAME: 'Opname',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tunai',
  QRIS: 'QRIS',
  TRANSFER: 'Transfer',
  E_WALLET: 'E-Wallet',
  CREDIT_CARD: 'Kartu Kredit',
  MIXED: 'Campuran',
};

export const PAYMENT_METHOD_ICONS: Record<string, string> = {
  CASH: 'cash',
  QRIS: 'qr-code',
  TRANSFER: 'bank',
  E_WALLET: 'wallet',
  CREDIT_CARD: 'credit-card',
  MIXED: 'layers',
};

export const CUSTOMER_TAG_LABELS: Record<string, string> = {
  VIP: 'VIP',
  REGULAR: 'Reguler',
  NEW: 'Baru',
  BLACKLIST: 'Blacklist',
};

export const CUSTOMER_TAG_COLORS: Record<string, string> = {
  VIP: 'purple',
  REGULAR: 'blue',
  NEW: 'green',
  BLACKLIST: 'red',
};

export const MENU_ITEMS = [
  { label: 'Dashboard', path: '/app/dashboard', icon: 'layout-dashboard', roles: ['OWNER', 'ADMIN', 'DOKTER', 'KASIR'] },
  { label: 'CRM & Pasien', path: '/app/crm/customers', icon: 'users', roles: ['OWNER', 'ADMIN', 'DOKTER', 'KASIR'] },
  { label: 'Janji Temu', path: '/app/appointments', icon: 'calendar-check', roles: ['OWNER', 'ADMIN', 'DOKTER'] },
  { label: 'Rekam Medis', path: '/app/medical-records', icon: 'clipboard-x', roles: ['OWNER', 'ADMIN', 'DOKTER'] },
  { label: 'Pet Hotel', path: '/app/pet-hotel/rooms', icon: 'hotel', roles: ['OWNER', 'ADMIN'] },
  { label: 'Grooming', path: '/app/grooming/services', icon: 'scissors', roles: ['OWNER', 'ADMIN'] },
  { label: 'Produk & Stok', path: '/app/products', icon: 'package', roles: ['OWNER', 'ADMIN', 'KASIR'] },
  { label: 'POS', path: '/app/pos', icon: 'store', roles: ['OWNER', 'ADMIN', 'KASIR'] },
  { label: 'Laporan', path: '/app/reports/revenue', icon: 'chart-bar', roles: ['OWNER', 'ADMIN'] },
  { label: 'Engagement', path: '/app/engagement/loyalty', icon: 'gift', roles: ['OWNER', 'ADMIN'] },
  { label: 'Keuangan', path: '/app/keuangan/expenses', icon: 'wallet', roles: ['OWNER', 'ADMIN'] },
  { label: 'Pengaturan', path: '/app/settings', icon: 'settings', roles: ['OWNER', 'ADMIN'] },
] as const;

export const PORTAL_MENU_ITEMS = [
  { label: 'Dashboard', path: '/portal/dashboard', icon: 'layout-dashboard' },
  { label: 'Hewan Peliharaan', path: '/portal/pets', icon: 'paw-print' },
  { label: 'Janji Temu', path: '/portal/appointments', icon: 'calendar-check' },
  { label: 'Pet Hotel', path: '/portal/pet-hotel', icon: 'hotel' },
  { label: 'Grooming', path: '/portal/grooming', icon: 'scissors' },
  { label: 'Riwayat Invoice', path: '/portal/invoices', icon: 'receipt' },
  { label: 'Loyalty', path: '/portal/loyalty', icon: 'gift' },
  { label: 'Toko', path: '/portal/shop', icon: 'shopping-bag' },
] as const;

export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Koneksi jaringan gagal. Silakan coba lagi.',
  UNAUTHORIZED: 'Anda tidak memiliki akses.',
  SESSION_EXPIRED: 'Sesi telah berakhir. Silakan login kembali.',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui.',
};

export const TOAST_DURATION_MS = 5000;
export const TOAST_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
export type ToastPosition = (typeof TOAST_POSITIONS)[number];
export const DEFAULT_TOAST_POSITION: ToastPosition = 'top-right';

export const SESSION_EXPIRY_HOURS = 24;
export const TOKEN_WARNING_MINUTES = 5;
