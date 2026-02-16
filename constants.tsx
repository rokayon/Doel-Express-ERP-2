
import React from 'react';
import { Trip, InventoryItem, Transaction, Staff, TicketSalesRecord, Counter, Coach } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <i className="fa-solid fa-chart-line"></i> },
  { id: 'coachRegister', label: 'Coach Register', icon: <i className="fa-solid fa-bus"></i> },
  { id: 'ticketSalesRecord', label: 'Sales Record', icon: <i className="fa-solid fa-ticket"></i> },
  { id: 'scheduling', label: 'Scheduling', icon: <i className="fa-solid fa-calendar-days"></i> },
  { id: 'inventory', label: 'Inventory', icon: <i className="fa-solid fa-boxes-stacked"></i> },
  { id: 'finance', label: 'Finance', icon: <i className="fa-solid fa-money-bill-transfer"></i> },
  { id: 'hr', label: 'HR', icon: <i className="fa-solid fa-users-gear"></i> },
  { id: 'maintenance', label: 'Maintenance', icon: <i className="fa-solid fa-wrench"></i> },
  { id: 'reports', label: 'Reports', icon: <i className="fa-solid fa-file-contract"></i> },
  { id: 'settings', label: 'Settings', icon: <i className="fa-solid fa-gears"></i> },
];

export const MOCK_COACHES: Coach[] = [
  { id: 'C001', coachNo: 'C-101', regNo: 'D-001', seats: 40, status: 'Active' },
  { id: 'C002', coachNo: 'C-205', regNo: 'D-005', seats: 40, status: 'Active' },
  { id: 'C003', coachNo: 'C-308', regNo: 'D-008', seats: 36, status: 'Active' },
  { id: 'C004', coachNo: 'C-412', regNo: 'D-012', seats: 40, status: 'Active' },
];

export const MOCK_TRIPS: Trip[] = [
  { id: 'T101', busNumber: 'D-001', coachNo: 'C-101', route: 'Dhaka - Chittagong', departureTime: '2024-05-20 08:30 AM', status: 'On Trip', driver: 'Rahim Uddin', guideName: 'Sumon Ahmed', capacity: 40, bookedSeats: 32 },
  { id: 'T102', busNumber: 'D-005', coachNo: 'C-205', route: 'Dhaka - Sylhet', departureTime: '2024-05-20 10:00 AM', status: 'Scheduled', driver: 'Karim Ahmed', guideName: 'Akash Mia', capacity: 40, bookedSeats: 15 },
  { id: 'T103', busNumber: 'D-008', coachNo: 'C-308', route: 'Dhaka - Rajshahi', departureTime: '2024-05-20 12:15 PM', status: 'Scheduled', driver: 'Selim Khan', guideName: 'Biplob Das', capacity: 36, bookedSeats: 8 },
  { id: 'T104', busNumber: 'D-012', coachNo: 'C-412', route: 'Dhaka - Khulna', departureTime: '2024-05-19 09:00 PM', status: 'Completed', driver: 'Jalal Mia', guideName: 'Hasan Ali', capacity: 40, bookedSeats: 40 },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'INV001', name: 'Radial Tire 295/80', category: 'Tires', stock: 12, minStock: 5, unit: 'pcs', lastUpdated: '2024-05-18' },
  { id: 'INV002', name: 'Engine Oil 15W40', category: 'Fluids', stock: 45, minStock: 20, unit: 'Liters', lastUpdated: '2024-05-19' },
  { id: 'INV003', name: 'Brake Pad Set', category: 'Brakes', stock: 4, minStock: 10, unit: 'sets', lastUpdated: '2024-05-15' },
  { id: 'INV004', name: 'Lead Acid Battery 12V', category: 'Electrical', stock: 8, minStock: 4, unit: 'pcs', lastUpdated: '2024-05-10' },
];

export const MOCK_FINANCE: Transaction[] = [
  { id: 'TX001', date: '2024-05-20', type: 'Income', category: 'Ticket Sales', amount: 45000, description: 'Counter Sales - Dhaka Station' },
  { id: 'TX002', date: '2024-05-20', type: 'Expense', category: 'Fuel', amount: 12000, description: 'Bus D-001 Refuel' },
  { id: 'TX003', date: '2024-05-19', type: 'Expense', category: 'Maintenance', amount: 5500, description: 'Brake repair for D-008' },
  { id: 'TX004', date: '2024-05-19', type: 'Income', category: 'Online Booking', amount: 22500, description: 'App bookings - Sylhet Route' },
];

export const MOCK_STAFF: Staff[] = [
  { id: 'EMP001', name: 'Abdur Rahman', role: 'Senior Driver', phone: '01712345678', status: 'Active', salary: 35000 },
  { id: 'EMP002', name: 'Sumon Ahmed', role: 'Conductor', phone: '01812345678', status: 'Active', salary: 22000 },
  { id: 'EMP003', name: 'Nazrul Islam', role: 'Mechanic', phone: '01912345678', status: 'Active', salary: 28000 },
  { id: 'EMP004', name: 'Farhana Akter', role: 'Counter Manager', phone: '01512345678', status: 'On Leave', salary: 25000 },
];

export const MOCK_TICKET_SALES: TicketSalesRecord[] = [
  {
    id: 'REC001',
    date: '2024-05-20',
    regNo: 'D-001',
    coachNo: 'C-101',
    driverName: 'Rahim Uddin',
    guideName: 'Sumon Ahmed',
    departureDate: '2024-05-20',
    departureSeatQty: 32,
    departureTaka: 27200,
    returnDate: '2024-05-21',
    returnSeatQty: 28,
    returnTaka: 23800,
    totalTaka: 51000,
    dieselLtr: 120,
    dieselCost: 12000,
    tripCost: 5000,
    totalCost: 17000,
    netProfit: 34000,
    abdullahpurOffice: 1000,
    coxsbazarOffice: 1500,
    sonargaonOffice: 800,
    dmd: 2000
  }
];

export const MOCK_COUNTERS: Counter[] = [
  { id: 'CNT-001', name: 'Dhaka Main Counter', location: 'Gabtoli, Dhaka', assignedOperatorId: 'sa-001', isActive: true, lastSync: '2024-05-20 09:00 AM' },
  { id: 'CNT-002', name: 'Chittagong Station', location: 'Dampara, Chittagong', assignedOperatorId: 'it-001', isActive: true, lastSync: '2024-05-20 10:30 AM' },
  { id: 'CNT-003', name: 'Sylhet Gateway', location: 'Kadamtali, Sylhet', assignedOperatorId: 'dv-001', isActive: false },
];
