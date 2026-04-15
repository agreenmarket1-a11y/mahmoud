export interface Employee {
  id?: string;
  userId: string;
  name: string;
  idNumber: string;
  nationality: string;
  jobTitle: string;
  linkedEntityId: string;
  linkedEntityType: 'project' | 'farm';
  status: 'active' | 'inactive' | 'on_leave';
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  totalSalary: number;
  lateSalaryCount: number;
  unpaidSalaryTotal: number;
  iqamaExpiry: string;
  imageUrl?: string;
}

export interface Project {
  id?: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold';
  startDate: string;
  endDate?: string;
}

export interface Farm {
  id?: string;
  userId: string;
  name: string;
  location: string;
  size: string;
  status: 'active' | 'inactive';
}

export interface Invoice {
  id?: string;
  userId: string;
  type: 'sale' | 'purchase' | 'operational_expense';
  date: string;
  amount: number;
  taxAmount: number;
  taxNumber: string;
  totalWithTax: number;
  paymentMethod: 'cash' | 'bank' | 'check' | 'credit';
  description: string;
  linkedEntityId: string;
  linkedEntityType: 'project' | 'farm';
  customerName?: string;
  category?: string;
  invoiceImageUrl?: string;
  fileUrl?: string;
}

export interface Attendance {
  id?: string;
  userId: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface Leave {
  id?: string;
  userId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: 'annual' | 'sick' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
}

export interface Loan {
  id?: string;
  userId: string;
  employeeId: string;
  amount: number;
  date: string;
  remainingAmount: number;
  status: 'active' | 'paid';
}

export interface Penalty {
  id?: string;
  userId: string;
  employeeId: string;
  amount: number;
  date: string;
  reason: string;
}

export interface FileRecord {
  id?: string;
  userId: string;
  linkedEntityId: string;
  linkedEntityType: 'project' | 'farm';
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  data?: any[]; // For Excel data
}
