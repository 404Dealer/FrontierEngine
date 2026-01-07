export const createServiceFixture = {
  name: "Haircut",
  description: "Standard men's haircut",
  duration_minutes: 30,
  buffer_minutes: 5,
  price: 25,
  currency_code: "usd",
}

export const createStaffFixture = {
  name: "John Barber",
  email: "john@barbershop.com",
  phone: "+1234567890",
  bio: "Expert barber with 10 years experience",
  is_active: true,
}

export const createAvailabilityRuleFixture = {
  rule_type: "recurring" as const,
  day_of_week: 1, // Monday
  start_time: "09:00",
  end_time: "17:00",
  is_available: true,
}

export const createBookingFixture = {
  service_id: "service-123",
  start_at: new Date("2025-01-15T10:00:00Z"),
  end_at: new Date("2025-01-15T10:30:00Z"),
  customer_email: "customer@example.com",
  customer_name: "Test Customer",
  // Required pricing snapshot fields
  service_name: "Haircut",
  price_amount: 25,
  currency_code: "usd",
}
