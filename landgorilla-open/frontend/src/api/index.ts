import api from './client';

// ── Auth ────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data.data);

// ── Portfolio ───────────────────────────────────────────────────────────────
export const getPortfolioSummary = () =>
  api.get('/portfolio/summary').then((r) => r.data.data);

export const getPortfolioPerformance = (months = 12) =>
  api.get(`/portfolio/performance?months=${months}`).then((r) => r.data.data);

// ── Loans ───────────────────────────────────────────────────────────────────
export const getLoans = (params?: Record<string, unknown>) =>
  api.get('/loans', { params }).then((r) => r.data);

export const getLoan = (id: string) =>
  api.get(`/loans/${id}`).then((r) => r.data.data);

export const createLoan = (data: Record<string, unknown>) =>
  api.post('/loans', data).then((r) => r.data.data);

export const updateLoan = (id: string, data: Record<string, unknown>) =>
  api.put(`/loans/${id}`, data).then((r) => r.data.data);

export const deleteLoan = (id: string) =>
  api.delete(`/loans/${id}`).then((r) => r.data);

// ── Borrowers ───────────────────────────────────────────────────────────────
export const getBorrowers = (params?: Record<string, unknown>) =>
  api.get('/borrowers', { params }).then((r) => r.data);

export const getBorrower = (id: string) =>
  api.get(`/borrowers/${id}`).then((r) => r.data.data);

export const createBorrower = (data: Record<string, unknown>) =>
  api.post('/borrowers', data).then((r) => r.data.data);

export const updateBorrower = (id: string, data: Record<string, unknown>) =>
  api.put(`/borrowers/${id}`, data).then((r) => r.data.data);

// ── Covenants ───────────────────────────────────────────────────────────────
export const getCovenants = (loanId: string) =>
  api.get(`/loans/${loanId}/covenants`).then((r) => r.data.data);

export const testCovenant = (loanId: string, covenantId: string, tested_value: number, notes?: string) =>
  api.post(`/loans/${loanId}/covenants/${covenantId}/test`, { tested_value, notes }).then((r) => r.data.data);

// ── Disbursements ───────────────────────────────────────────────────────────
export const getDisbursements = (loanId: string) =>
  api.get(`/loans/${loanId}/disbursements`).then((r) => r.data);

export const approveDisbursement = (loanId: string, disbId: string) =>
  api.post(`/loans/${loanId}/disbursements/${disbId}/approve`).then((r) => r.data.data);

// ── Payments ────────────────────────────────────────────────────────────────
export const getPayments = (loanId: string) =>
  api.get(`/loans/${loanId}/payments`).then((r) => r.data);

// ── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks = (params?: Record<string, unknown>) =>
  api.get('/tasks', { params }).then((r) => r.data);

export const updateTask = (id: string, data: Record<string, unknown>) =>
  api.put(`/tasks/${id}`, data).then((r) => r.data.data);

export const createTask = (data: Record<string, unknown>) =>
  api.post('/tasks', data).then((r) => r.data.data);

// ── Properties ──────────────────────────────────────────────────────────────
export const getProperties = (params?: Record<string, unknown>) =>
  api.get('/properties', { params }).then((r) => r.data);

export const getProperty = (id: string) =>
  api.get(`/properties/${id}`).then((r) => r.data.data);

export const createProperty = (data: Record<string, unknown>) =>
  api.post('/properties', data).then((r) => r.data.data);

export const addValuation = (propertyId: string, data: Record<string, unknown>) =>
  api.post(`/properties/${propertyId}/valuations`, data).then((r) => r.data.data);
