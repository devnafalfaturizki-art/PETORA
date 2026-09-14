-- ============================================
-- PET HOTEL ROOMS
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  room_number VARCHAR(20),
  room_type VARCHAR(20) NOT NULL,
  price_per_night DECIMAL(12,2) NOT NULL,
  capacity INTEGER DEFAULT 1,
  status room_status DEFAULT 'AVAILABLE',
  cleanliness room_cleanliness DEFAULT 'CLEAN',
  maintenance_status BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- PET HOTEL BOOKINGS
-- ============================================
CREATE TABLE pet_hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  pet_id UUID NOT NULL REFERENCES pets(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  room_id UUID REFERENCES rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in_at TIMESTAMPTZ,
  actual_check_out_at TIMESTAMPTZ,
  price_per_night DECIMAL(12,2),
  total_price DECIMAL(12,2),
  status pet_hotel_booking_status DEFAULT 'BOOKED',
  special_notes TEXT,
  is_from_portal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_hotel_bookings_pet_id ON pet_hotel_bookings(pet_id);
CREATE INDEX idx_pet_hotel_bookings_room_id ON pet_hotel_bookings(room_id);
CREATE INDEX idx_pet_hotel_bookings_status ON pet_hotel_bookings(status);

-- ============================================
-- PET HOTEL LOGS
-- ============================================
CREATE TABLE pet_hotel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES pet_hotel_bookings(id) ON DELETE CASCADE,
  log_type pet_hotel_log_type NOT NULL,
  description TEXT,
  photo_urls TEXT[],
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pet_hotel_logs_booking_id ON pet_hotel_logs(booking_id);