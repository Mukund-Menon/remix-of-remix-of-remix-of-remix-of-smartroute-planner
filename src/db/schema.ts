import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Travel Companion app tables - NO AUTH
export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(),
  destination: text('destination').notNull(),
  sourceCoordinates: text('source_coordinates'),
  destinationCoordinates: text('destination_coordinates'),
  travelDate: text('travel_date').notNull(),
  travelTime: text('travel_time').notNull(),
  transportMode: text('transport_mode').notNull(),
  optimizationMode: text('optimization_mode').notNull(),
  status: text('status').notNull().default('active'),
  routeData: text('route_data', { mode: 'json' }),
  routeGeometry: text('route_geometry', { mode: 'json' }),
  matchRadius: integer('match_radius').notNull().default(10),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  tripId: integer('trip_id').references(() => trips.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const groupMembers = sqliteTable('group_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  memberName: text('member_name').notNull(),
  memberEmail: text('member_email'),
  role: text('role').notNull().default('member'),
  joinedAt: text('joined_at').notNull(),
});

export const tripMatches = sqliteTable('trip_matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  matchedTripId: integer('matched_trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  matchScore: integer('match_score').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});

export const emergencyContacts = sqliteTable('emergency_contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  relationship: text('relationship'),
  createdAt: text('created_at').notNull(),
});

export const emergencyAlerts = sqliteTable('emergency_alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').references(() => trips.id, { onDelete: 'set null' }),
  alertType: text('alert_type').notNull(),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),
  locationName: text('location_name'),
  message: text('message').notNull(),
  sentTo: text('sent_to', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
});