-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'DOKTER', 'KASIR', 'CUSTOMER');
CREATE TYPE appointment_status AS ENUM ('WAITING', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE medical_record_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE room_status AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE room_cleanliness AS ENUM ('CLEAN', 'DIRTY', 'UNDER_CLEANING');
CREATE TYPE pet_hotel_booking_status AS ENUM ('BOOKED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
CREATE TYPE grooming_booking_status AS ENUM ('BOOKED', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE stock_movement_type AS ENUM ('IN', 'OUT', 'RETURN', 'ADJUSTMENT', 'DAMAGED', 'EXPIRED', 'OPNAME');
CREATE TYPE invoice_type AS ENUM ('POS', 'CLINICAL', 'PET_HOTEL', 'GROOMING', 'MIXED');
CREATE TYPE invoice_status AS ENUM ('UNPAID', 'PARTIAL_PAYMENT', 'PAID', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH', 'QRIS', 'TRANSFER', 'E_WALLET', 'CREDIT_CARD', 'MIXED');
CREATE TYPE purchase_order_status AS ENUM ('DRAFT', 'SENT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE loyalty_tier_name AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE loyalty_transaction_type AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUST');
CREATE TYPE promotion_type AS ENUM ('PERCENTAGE', 'FIXED', 'BUNDLE', 'HAPPY_HOUR', 'BIRTHDAY');
CREATE TYPE promotion_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE expense_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED');
CREATE TYPE feedback_rating AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE pet_hotel_log_type AS ENUM ('FEEDING', 'MEDICINE', 'NOTE');
CREATE TYPE customer_tag AS ENUM ('VIP', 'REGULAR', 'NEW', 'BLACKLIST');

-- ============================================
-- SEQUENCE COUNTERS (untuk number generation)
-- ============================================
CREATE TABLE sequence_counters (
  prefix TEXT NOT NULL,
  date TEXT NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (prefix, date)
);

-- ============================================
-- HELPER FUNCTIONS FOR SEQUENCE GENERATION
-- ============================================
CREATE OR REPLACE FUNCTION fn_generate_sequence_number(
  p_prefix TEXT,
  p_date DATE
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence INTEGER;
  v_date_str TEXT;
BEGIN
  v_date_str := TO_CHAR(p_date, 'YYYYMMDD');
  INSERT INTO sequence_counters (prefix, date, current_value)
  VALUES (p_prefix, v_date_str, 1)
  ON CONFLICT (prefix, date)
  DO UPDATE SET current_value = sequence_counters.current_value + 1
  RETURNING current_value INTO v_sequence;
  RETURN p_prefix || '-' || v_date_str || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$;