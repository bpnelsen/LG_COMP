export interface Organization {
  id: string;
  name: string;
  type: 'bank' | 'credit_union' | 'private_lender' | 'insurance';
  license_number?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'loan_officer' | 'analyst' | 'viewer';
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Borrower {
  id: string;
  organization_id: string;
  entity_type: 'individual' | 'llc' | 'corporation' | 'partnership' | 'trust';
  legal_name: string;
  tax_id?: string;
  credit_score?: number;
  annual_revenue?: number;
  net_worth?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Property {
  id: string;
  organization_id: string;
  borrower_id: string;
  property_type: 'residential' | 'commercial' | 'industrial' | 'land' | 'mixed_use';
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  parcel_number?: string;
  square_footage?: number;
  lot_size?: number;
  year_built?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type LoanStatus =
  | 'application'
  | 'underwriting'
  | 'approved'
  | 'funded'
  | 'performing'
  | 'watchlist'
  | 'default'
  | 'foreclosure'
  | 'paid_off'
  | 'charged_off';

export interface Loan {
  id: string;
  organization_id: string;
  loan_number: string;
  borrower_id: string;
  property_id: string;
  loan_officer_id: string;
  status: LoanStatus;
  loan_type: 'construction' | 'bridge' | 'permanent' | 'mezzanine' | 'equity';
  original_balance: number;
  current_balance: number;
  committed_amount: number;
  interest_rate: number;
  rate_type: 'fixed' | 'variable';
  origination_date?: Date;
  maturity_date?: Date;
  ltv_ratio?: number;
  dscr?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Covenant {
  id: string;
  loan_id: string;
  covenant_type: 'financial' | 'reporting' | 'operational' | 'insurance';
  description: string;
  threshold_value?: number;
  threshold_operator?: '<' | '<=' | '>' | '>=' | '=';
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'one_time';
  next_due_date?: Date;
  status: 'compliant' | 'waived' | 'exception' | 'breach';
  last_tested_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Disbursement {
  id: string;
  loan_id: string;
  amount: number;
  disbursement_date: Date;
  description?: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'disbursed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  created_at: Date;
}

export interface JwtPayload {
  user_id: string;
  organization_id: string;
  email: string;
  role: User['role'];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface LoanFilters extends PaginationQuery {
  status?: LoanStatus;
  loan_type?: string;
  borrower_id?: string;
  loan_officer_id?: string;
  min_balance?: number;
  max_balance?: number;
}

export interface PortfolioSummary {
  total_loans: number;
  total_committed: number;
  total_outstanding: number;
  performing_loans: number;
  watchlist_loans: number;
  default_loans: number;
  avg_interest_rate: number;
  avg_ltv: number;
  avg_dscr: number;
  loans_by_type: Record<string, number>;
  loans_by_status: Record<string, number>;
}
