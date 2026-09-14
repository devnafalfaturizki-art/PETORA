-- ============================================
-- GROOMING SERVICES
-- ============================================
CREATE TABLE grooming_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(12,2) NOT NULL,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- GROOMING BOOKINGS
-- ============================================
CREATE TABLE grooming_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  pet_id UUID NOT NULL REFERENCES pets(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  groomer_id UUID REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES grooming_services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status grooming_booking_status DEFAULT 'BOOKED',
  total_price DECIMAL(12,2),
  notes TEXT,
  is_from_portal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grooming_bookings_pet_id ON grooming_bookings(pet_id);
CREATE INDEX idx_grooming_bookings_groomer_id ON grooming_bookings(groomer_id);
CREATE INDEX idx_grooming_bookings_status ON grooming_bookings(status);

-- ============================================
-- GROOMING RECORDS
-- ============================================
CREATE TABLE grooming_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES grooming_bookings(id),
  skin_condition TEXT,
  flea_tick_found BOOLEAN DEFAULT FALSE,
  recommendations TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);