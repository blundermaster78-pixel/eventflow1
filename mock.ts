import type { EventTemplate, Reservation, Resource } from '../types'
import { addDays, todayISO } from '../lib/date'
import { detectOverlaps } from '../lib/conflicts'

export const resources: Resource[] = [
  { id: 'stage', name: 'Main Stage', short: 'Stage', category: 'Staging', description: 'Modular 12m × 8m performance stage with backstage wing.', spec: '12 × 8 m · 800 kg/m²' },
  { id: 'generator', name: 'Generator 50KVA', short: 'Generator', category: 'Power', description: 'Silent diesel generator for outdoor and backup power.', spec: '50 KVA · 3-phase' },
  { id: 'sound', name: 'Sound System', short: 'Sound', category: 'Audio', description: 'Line-array PA with 16-channel mixer and wireless mics.', spec: '8 kW · 16 channels' },
  { id: 'led', name: 'LED Display', short: 'LED', category: 'Visual', description: 'Outdoor P3.9 LED video wall for live feeds and visuals.', spec: '6 × 3 m · P3.9' },
  { id: 'projector', name: 'Projector', short: 'Projector', category: 'Visual', description: 'High-lumen laser projector with tripod screen.', spec: '12,000 lm · 4K' },
  { id: 'chairs', name: 'Folding Chairs', short: 'Chairs', category: 'Furniture', description: 'Stackable folding chairs, delivered in lots of 50.', spec: '500 units' },
]

const d = (n: number) => addDays(todayISO(), n)

// Dates are relative to "today" so the demo always shows the next two weeks.
export const mockReservations: Reservation[] = [
  { id: 'res-01', event: 'Freshers Welcome Concert', organizer: 'Student Council', date: d(1), start: '17:00', end: '22:00', resourceIds: ['stage', 'generator', 'sound', 'led'], status: 'confirmed' },
  { id: 'res-02', event: 'Tech Symposium Keynote', organizer: 'CS Department', date: d(2), start: '09:00', end: '13:00', resourceIds: ['stage', 'projector', 'sound', 'chairs'], status: 'confirmed' },
  { id: 'res-03', event: 'Robotics Expo', organizer: 'Robotics Club', date: d(3), start: '10:00', end: '16:00', resourceIds: ['led', 'projector', 'chairs'], status: 'confirmed' },
  { id: 'res-04', event: 'Photography Workshop', organizer: 'Arts Society', date: d(3), start: '13:00', end: '15:00', resourceIds: ['projector', 'chairs'], status: 'pending' },
  { id: 'res-05', event: 'Alumni Gala Night', organizer: 'Alumni Office', date: d(4), start: '18:00', end: '23:00', resourceIds: ['stage', 'sound', 'led', 'chairs', 'generator'], status: 'confirmed' },
  { id: 'res-06', event: 'Open Mic Night', organizer: 'Drama Society', date: d(4), start: '20:00', end: '22:00', resourceIds: ['sound', 'generator'], status: 'pending' },
  { id: 'res-07', event: 'Career Fair', organizer: 'Placement Cell', date: d(6), start: '09:00', end: '17:00', resourceIds: ['chairs', 'projector', 'led'], status: 'confirmed' },
  { id: 'res-08', event: 'Cultural Fest Rehearsal', organizer: 'Cultural Committee', date: d(7), start: '14:00', end: '18:00', resourceIds: ['stage', 'sound'], status: 'confirmed' },
  { id: 'res-09', event: 'Department Awards Ceremony', organizer: 'Dean’s Office', date: d(7), start: '16:00', end: '19:00', resourceIds: ['stage', 'projector'], status: 'pending' },
  { id: 'res-10', event: 'Hackathon Opening', organizer: 'Developer Club', date: d(9), start: '10:00', end: '12:00', resourceIds: ['projector', 'led', 'chairs'], status: 'confirmed' },
  { id: 'res-11', event: 'Sports Day Closing', organizer: 'Sports Committee', date: d(10), start: '15:00', end: '20:00', resourceIds: ['generator', 'sound', 'chairs'], status: 'confirmed' },
  { id: 'res-12', event: 'Open-Air Film Screening', organizer: 'Film Club', date: d(11), start: '19:00', end: '22:00', resourceIds: ['projector', 'sound', 'led'], status: 'confirmed' },
  { id: 'res-13', event: 'Convocation Rehearsal', organizer: 'Registrar Office', date: d(12), start: '09:00', end: '15:00', resourceIds: ['stage', 'chairs', 'sound', 'generator'], status: 'confirmed' },
  { id: 'res-14', event: 'Farewell Party', organizer: 'Class of 2026', date: d(13), start: '18:00', end: '23:00', resourceIds: ['stage', 'sound', 'generator', 'led'], status: 'confirmed' },
]

export const eventTemplates: EventTemplate[] = [
  { id: 'concert', label: 'Concert / Cultural Night', name: 'Cultural Night', hours: 3, resources: ['stage', 'generator', 'sound'] },
  { id: 'conference', label: 'Conference / Keynote', name: 'Tech Conference', hours: 4, resources: ['stage', 'projector', 'sound', 'chairs'] },
  { id: 'expo', label: 'Expo / Fair', name: 'Innovation Expo', hours: 5, resources: ['led', 'projector', 'chairs'] },
  { id: 'ceremony', label: 'Ceremony', name: 'Awards Ceremony', hours: 3, resources: ['stage', 'sound', 'led', 'chairs'] },
  { id: 'screening', label: 'Film Screening', name: 'Open-Air Screening', hours: 3, resources: ['projector', 'sound', 'chairs', 'generator'] },
]

// Conflicts that already exist in the seed data (pending requests overlapping confirmed bookings)
export const seedConflicts = detectOverlaps(mockReservations)
