import { Router, Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiResponse, PortfolioSummary } from '../types';

const router = Router();

router.use(authenticate);

// GET /portfolio/summary
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  const orgId = req.user!.organization_id;

  const [summaryRows, byType, byStatus] = await Promise.all([
    query<{
      total_loans: string;
      total_committed: string;
      total_outstanding: string;
      performing_loans: string;
      watchlist_loans: string;
      default_loans: string;
      avg_interest_rate: string;
      avg_ltv: string;
      avg_dscr: string;
    }>(
      `SELECT
         COUNT(*) as total_loans,
         COALESCE(SUM(committed_amount), 0) as total_committed,
         COALESCE(SUM(current_balance), 0) as total_outstanding,
         COUNT(*) FILTER (WHERE status = 'performing') as performing_loans,
         COUNT(*) FILTER (WHERE status = 'watchlist') as watchlist_loans,
         COUNT(*) FILTER (WHERE status IN ('default','foreclosure')) as default_loans,
         COALESCE(AVG(interest_rate), 0) as avg_interest_rate,
         COALESCE(AVG(ltv_ratio), 0) as avg_ltv,
         COALESCE(AVG(dscr), 0) as avg_dscr
       FROM loans
       WHERE organization_id = $1 AND is_active = true`,
      [orgId]
    ),
    query<{ loan_type: string; count: string }>(
      `SELECT loan_type, COUNT(*) as count FROM loans
       WHERE organization_id = $1 AND is_active = true
       GROUP BY loan_type ORDER BY count DESC`,
      [orgId]
    ),
    query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM loans
       WHERE organization_id = $1 AND is_active = true
       GROUP BY status ORDER BY count DESC`,
      [orgId]
    ),
  ]);

  const raw = summaryRows[0];
  const summary: PortfolioSummary = {
    total_loans: parseInt(raw.total_loans),
    total_committed: parseFloat(raw.total_committed),
    total_outstanding: parseFloat(raw.total_outstanding),
    performing_loans: parseInt(raw.performing_loans),
    watchlist_loans: parseInt(raw.watchlist_loans),
    default_loans: parseInt(raw.default_loans),
    avg_interest_rate: parseFloat(parseFloat(raw.avg_interest_rate).toFixed(4)),
    avg_ltv: parseFloat(parseFloat(raw.avg_ltv).toFixed(4)),
    avg_dscr: parseFloat(parseFloat(raw.avg_dscr).toFixed(4)),
    loans_by_type: Object.fromEntries(byType.map((r) => [r.loan_type, parseInt(r.count)])),
    loans_by_status: Object.fromEntries(byStatus.map((r) => [r.status, parseInt(r.count)])),
  };

  const response: ApiResponse<PortfolioSummary> = { success: true, data: summary };
  res.json(response);
});

// GET /portfolio/performance
router.get('/performance', async (req: AuthRequest, res: Response): Promise<void> => {
  const orgId = req.user!.organization_id;
  const months = Math.min(parseInt((req.query.months as string) || '12'), 24);

  const monthlyData = await query<{
    month: string;
    new_loans: string;
    total_disbursed: string;
    avg_rate: string;
    total_outstanding: string;
  }>(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', origination_date), 'YYYY-MM') as month,
       COUNT(*) as new_loans,
       COALESCE(SUM(committed_amount), 0) as total_disbursed,
       COALESCE(AVG(interest_rate), 0) as avg_rate,
       COALESCE(SUM(current_balance), 0) as total_outstanding
     FROM loans
     WHERE organization_id = $1
       AND is_active = true
       AND origination_date >= NOW() - ($2 || ' months')::interval
     GROUP BY DATE_TRUNC('month', origination_date)
     ORDER BY month`,
    [orgId, months]
  );

  const covenantCompliance = await query<{
    compliant: string;
    exception: string;
    breach: string;
    waived: string;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE c.status = 'compliant') as compliant,
       COUNT(*) FILTER (WHERE c.status = 'exception') as exception,
       COUNT(*) FILTER (WHERE c.status = 'breach') as breach,
       COUNT(*) FILTER (WHERE c.status = 'waived') as waived
     FROM covenants c
     JOIN loans l ON c.loan_id = l.id
     WHERE l.organization_id = $1 AND c.is_active = true AND l.is_active = true`,
    [orgId]
  );

  const overdueCovenants = await query(
    `SELECT c.id, c.description, c.covenant_type, c.next_due_date, c.status,
            l.loan_number, l.id as loan_id
     FROM covenants c
     JOIN loans l ON c.loan_id = l.id
     WHERE l.organization_id = $1
       AND c.is_active = true
       AND l.is_active = true
       AND c.next_due_date < NOW()
       AND c.status NOT IN ('waived')
     ORDER BY c.next_due_date
     LIMIT 20`,
    [orgId]
  );

  const response: ApiResponse = {
    success: true,
    data: {
      monthly_originations: monthlyData,
      covenant_compliance: covenantCompliance[0] || {},
      overdue_covenants: overdueCovenants,
    },
  };
  res.json(response);
});

export default router;
