import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Categories table
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  colour: text('colour').notNull().default('#4A90D9'),
  icon: text('icon').notNull().default('tag'),
  userId: integer('user_id').notNull(),
});

// Locations table 
export const locations = sqliteTable('locations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  userId: integer('user_id').notNull(),
});

// Trips table 
export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  locationId: integer('location_id').notNull(),
  userId: integer('user_id').notNull(),
});

// Activities table 
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  dayNumber: integer('day_number').notNull(), 
  duration: integer('duration').notNull().default(1), 
  notes: text('notes').default(''),
  completed: integer('completed').notNull().default(0), 
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id').notNull(),
  locationId: integer('location_id'), 
  userId: integer('user_id').notNull(),
});

// Targets table 
export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  targetValue: integer('target_value').notNull(), 
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id').notNull(),
  userId: integer('user_id').notNull(),
});

// Users table 
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
});