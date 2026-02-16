
export enum AppRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGING_DIRECTOR = 'MANAGING_DIRECTOR',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
  ACCOUNTS = 'ACCOUNTS',
  HR = 'HR',
  IT = 'IT',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  MARKETING = 'MARKETING',
  MANAGER = 'MANAGER',
  COUNTER = 'COUNTER',
  DRIVER = 'DRIVER',
  SUPERVISOR = 'SUPERVISOR'
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: AppRole;
  isApproved: boolean;
  createdAt: string;
  profilePhoto?: string;
  nidPhoto?: string;
}

export interface Counter {
  id: string;
  name: string;
  location: string;
  assignedOperatorId?: string;
  isActive: boolean;
  lastSync?: string;
}

export interface Coach {
  id: string;
  coachNo: string;
  regNo: string;
  seats: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
  // Optional GPS Device ID for real-time tracking
  gpsDeviceId?: string;
}

export interface Trip {
  id: string;
  busNumber: string; // Used as regNo in sales
  coachNo: string;
  route: string;
  departureTime: string;
  status: 'Scheduled' | 'On Trip' | 'Completed' | 'Delayed' | 'Cancelled';
  driver: string;
  guideName?: string;
  capacity: number;
  bookedSeats: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  salary: number;
  photo?: string;
  nidPhoto?: string;
  licensePhoto?: string;
}

export interface TicketSalesRecord {
  id: string;
  date: string;
  regNo: string;
  coachNo: string;
  driverName: string;
  guideName: string;
  departureDate: string;
  departureSeatQty: number;
  departureTaka: number;
  returnDate: string;
  returnSeatQty: number;
  returnTaka: number;
  totalTaka: number;
  dieselLtr: number;
  dieselCost: number;
  tripCost: number;
  totalCost: number;
  netProfit: number;
  abdullahpurOffice: number;
  coxsbazarOffice: number;
  sonargaonOffice: number;
  dmd: number;
  tripId?: string;
  counterName?: string;
  operatorName?: string;
  ticketsSold?: number;
  ticketPrice?: number;
  discount?: number;
  salesCommission?: number;
  totalAmount?: number;
  time?: string;
  busNumber?: string;
}
