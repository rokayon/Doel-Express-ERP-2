
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
  name?: string;
  username: string;
  email: string;
  password?: string;
  role: AppRole;
  isApproved: boolean;
  createdAt: string;
  profilePhoto?: string;
  nidPhoto?: string;
  permissions?: string[];
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
  gpsDeviceId?: string;
  type?: string;
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
  partNo?: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  lastUpdated: string;
}

export interface InventoryIssue {
  id: string;
  date: string;
  itemId?: string;
  itemName: string;
  partNo?: string;
  qty: number;
  unit: string;
  busNo?: string;
  side?: string;
  receiver?: string;
  remarks?: string;
}

export interface InventoryReceipt {
  id: string;
  date: string;
  itemId?: string;
  itemName: string;
  partNo?: string;
  category?: string;
  qty: number;
  unit: string;
  companyName?: string;
  contactInfo?: string;
  remarks?: string;
}

export interface PartsRequisitionItem {
  partsName: string;
  partsNo?: string;
  quantity: string;
  remarks?: string;
}

export interface PartsRequisition {
  id: string;
  voucherNo: string;
  date: string;
  ref?: string;
  busNo?: string;
  receivedName?: string;
  items: PartsRequisitionItem[];
  total?: string;
  approvedBy?: string;
  foreman?: string;
  receivedBySign?: string;
  createdAt: string;
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
  email?: string;
  nid?: string;
  address?: string;
  designation?: string;
  department?: string;
  status: 'Active' | 'On Leave' | 'Inactive' | 'Expired' | 'Resigned' | 'Terminated';
  salary: number;
  joiningDate?: string;
  expiryDate?: string;
  photo?: string;
  nidPhoto?: string;
  licensePhoto?: string;
  licenseNumber?: string;
  licenseCategory?: 'Heavy' | 'Medium' | 'Light';
  documents?: string[];
  emergencyContact?: string;
  notes?: string;
  hasPhoto?: boolean;
  hasNidPhoto?: boolean;
  hasLicensePhoto?: boolean;
}

export interface Voucher {
  id: string;
  name: string;
  image?: string;
  images?: string[];
  createdAt: string;
  expiresAt: string;
}

export interface BkashRecord {
  id: string;
  date: string;
  merchant: 'Dhaka' | 'Cox';
  openingBalance: number;
  dailyReceived: number;
  merchantToBank: number;
  bkashCharge: number;
  netBankReceipt: number;
  closingBalance: number;
  notes?: string;
}

export interface BusBdRecord {
  id: string;
  date: string;
  openingAmount: number;
  noOfTickets: number;
  ticketAmount: number;
  commission: number;
  softwareCommission: number;
  doelWithdrawAmount: number;
  closingAmount: number;
  notes?: string;
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
