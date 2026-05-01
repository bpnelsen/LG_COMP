const spec = {
  openapi: '3.0.3',
  info: {
    title: 'LoanScope API',
    version: '1.0.0',
    description: 'Commercial lending portfolio management platform',
  },
  servers: [{ url: '/api', description: 'Current server' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          per_page: { type: 'integer' },
          total_pages: { type: 'integer' },
        },
      },
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['bank', 'credit_union', 'private_lender', 'insurance'] },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'loan_officer', 'analyst', 'viewer'] },
          is_active: { type: 'boolean' },
          last_login: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Borrower: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          entity_type: { type: 'string', enum: ['individual', 'llc', 'corporation', 'partnership', 'trust'] },
          legal_name: { type: 'string' },
          dba_name: { type: 'string', nullable: true },
          credit_score: { type: 'integer', nullable: true },
          annual_revenue: { type: 'number', nullable: true },
          net_worth: { type: 'number', nullable: true },
          industry: { type: 'string', nullable: true },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Contact: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          borrower_id: { type: 'string', format: 'uuid' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          title: { type: 'string', nullable: true },
          email: { type: 'string', format: 'email', nullable: true },
          phone: { type: 'string', nullable: true },
          is_primary: { type: 'boolean' },
          contact_type: { type: 'string', enum: ['general', 'guarantor', 'authorized_signer', 'beneficial_owner'] },
        },
      },
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          borrower_id: { type: 'string', format: 'uuid' },
          property_type: { type: 'string', enum: ['residential', 'commercial', 'industrial', 'land', 'mixed_use'] },
          address_line1: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip_code: { type: 'string' },
          square_footage: { type: 'number', nullable: true },
          year_built: { type: 'integer', nullable: true },
          occupancy_rate: { type: 'number', nullable: true },
          noi: { type: 'number', nullable: true },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Loan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          loan_number: { type: 'string' },
          loan_type: { type: 'string', enum: ['construction', 'bridge', 'permanent', 'mezzanine', 'equity'] },
          status: { type: 'string', enum: ['application', 'underwriting', 'approved', 'funded', 'performing', 'watchlist', 'default', 'foreclosure', 'paid_off', 'charged_off'] },
          committed_amount: { type: 'number' },
          current_balance: { type: 'number' },
          interest_rate: { type: 'number' },
          rate_type: { type: 'string', enum: ['fixed', 'variable'] },
          origination_date: { type: 'string', format: 'date-time', nullable: true },
          maturity_date: { type: 'string', format: 'date-time', nullable: true },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Covenant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          loan_id: { type: 'string', format: 'uuid' },
          covenant_type: { type: 'string', enum: ['financial', 'reporting', 'operational', 'insurance'] },
          description: { type: 'string' },
          threshold_value: { type: 'number', nullable: true },
          threshold_operator: { type: 'string', enum: ['<', '<=', '>', '>=', '='], nullable: true },
          frequency: { type: 'string', enum: ['monthly', 'quarterly', 'semi_annual', 'annual', 'one_time'] },
          status: { type: 'string', enum: ['pending', 'compliant', 'exception', 'breach', 'waived'] },
          next_due_date: { type: 'string', format: 'date', nullable: true },
          last_tested_at: { type: 'string', format: 'date-time', nullable: true },
          last_tested_value: { type: 'number', nullable: true },
        },
      },
      Disbursement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          loan_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'approved', 'disbursed', 'cancelled'] },
          disbursement_date: { type: 'string', format: 'date' },
          wire_reference: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          loan_id: { type: 'string', format: 'uuid' },
          payment_date: { type: 'string', format: 'date' },
          amount: { type: 'number' },
          principal: { type: 'number' },
          interest: { type: 'number' },
          fees: { type: 'number' },
          balance_after: { type: 'number' },
          payment_method: { type: 'string', nullable: true },
          reference_number: { type: 'string', nullable: true },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['open', 'in_progress', 'completed', 'cancelled'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          due_date: { type: 'string', format: 'date', nullable: true },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
          loan_id: { type: 'string', format: 'uuid', nullable: true },
          assigned_to: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      // ── Prolink schemas ───────────────────────────────────────────────────────
      Contractor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          company_name: { type: 'string' },
          dba_name: { type: 'string', nullable: true },
          contractor_type: { type: 'string', enum: ['general','electrical','plumbing','framing','roofing','hvac','concrete','masonry','painting','landscaping','other'] },
          license_number: { type: 'string', nullable: true },
          license_state: { type: 'string', nullable: true },
          license_expiry: { type: 'string', format: 'date', nullable: true },
          insurance_carrier: { type: 'string', nullable: true },
          insurance_expiry: { type: 'string', format: 'date', nullable: true },
          insurance_amount: { type: 'number', nullable: true },
          bond_amount: { type: 'number', nullable: true },
          bond_expiry: { type: 'string', format: 'date', nullable: true },
          primary_contact_name: { type: 'string', nullable: true },
          primary_contact_email: { type: 'string', format: 'email', nullable: true },
          primary_contact_phone: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['active','inactive','suspended','pending_review'] },
          is_approved_vendor: { type: 'boolean' },
          approved_at: { type: 'string', format: 'date-time', nullable: true },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      LoanContractor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          loan_id: { type: 'string', format: 'uuid' },
          contractor_id: { type: 'string', format: 'uuid' },
          company_name: { type: 'string' },
          contractor_type: { type: 'string' },
          role: { type: 'string', enum: ['general_contractor','sub_contractor','architect','engineer','inspector'] },
          contract_amount: { type: 'number', nullable: true },
          scope_of_work: { type: 'string', nullable: true },
          start_date: { type: 'string', format: 'date', nullable: true },
          expected_completion_date: { type: 'string', format: 'date', nullable: true },
          actual_completion_date: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['active','completed','terminated'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      DrawRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          loan_id: { type: 'string', format: 'uuid' },
          contractor_id: { type: 'string', format: 'uuid', nullable: true },
          contractor_name: { type: 'string', nullable: true },
          draw_number: { type: 'integer' },
          requested_amount: { type: 'number' },
          requested_date: { type: 'string', format: 'date' },
          description: { type: 'string', nullable: true },
          line_items: { type: 'object', nullable: true },
          inspector_name: { type: 'string', nullable: true },
          inspection_date: { type: 'string', format: 'date', nullable: true },
          inspection_notes: { type: 'string', nullable: true },
          percent_complete: { type: 'number', nullable: true },
          approved_amount: { type: 'number', nullable: true },
          status: { type: 'string', enum: ['draft','submitted','inspection_scheduled','inspection_complete','approved','rejected','funded'] },
          submitted_at: { type: 'string', format: 'date-time', nullable: true },
          approved_at: { type: 'string', format: 'date-time', nullable: true },
          funded_at: { type: 'string', format: 'date-time', nullable: true },
          rejection_reason: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Health ────────────────────────────────────────────────────────────────
    // (mounted at root, outside /api)

    // ── Auth ──────────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@loanscope.io' },
                  password: { type: 'string', minLength: 8, example: 'Admin1234!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'first_name', 'last_name', 'organization_id'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  organization_id: { type: 'string', format: 'uuid' },
                  role: { type: 'string', enum: ['admin', 'loan_officer', 'analyst', 'viewer'], default: 'viewer' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } } } },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── Borrowers ─────────────────────────────────────────────────────────────
    '/borrowers': {
      get: {
        tags: ['Borrowers'],
        summary: 'List borrowers',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by legal name' },
          { name: 'entity_type', in: 'query', schema: { type: 'string', enum: ['individual', 'llc', 'corporation', 'partnership', 'trust'] } },
        ],
        responses: {
          200: { description: 'Borrower list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Borrower' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
        },
      },
      post: {
        tags: ['Borrowers'],
        summary: 'Create borrower',
        description: 'Requires admin or loan_officer role',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entity_type', 'legal_name'],
                properties: {
                  entity_type: { type: 'string', enum: ['individual', 'llc', 'corporation', 'partnership', 'trust'] },
                  legal_name: { type: 'string' },
                  dba_name: { type: 'string' },
                  credit_score: { type: 'integer', minimum: 300, maximum: 850 },
                  annual_revenue: { type: 'number' },
                  net_worth: { type: 'number' },
                  industry: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Borrower created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Borrower' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/borrowers/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Borrowers'],
        summary: 'Get borrower with contacts and loans',
        responses: {
          200: { description: 'Borrower detail' },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Borrowers'],
        summary: 'Update borrower',
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Borrower' } } } },
        responses: {
          200: { description: 'Updated' },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Borrowers'],
        summary: 'Soft-delete borrower',
        description: 'Requires admin role',
        responses: {
          200: { description: 'Deleted' },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/borrowers/{id}/contacts': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Borrowers'],
        summary: 'List contacts for a borrower',
        responses: { 200: { description: 'Contact list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Contact' } } } } } } } },
      },
      post: {
        tags: ['Borrowers'],
        summary: 'Add contact to borrower',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['first_name', 'last_name'],
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  title: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  is_primary: { type: 'boolean' },
                  contact_type: { type: 'string', enum: ['general', 'guarantor', 'authorized_signer', 'beneficial_owner'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Contact created' } },
      },
    },

    // ── Properties ────────────────────────────────────────────────────────────
    '/properties': {
      get: {
        tags: ['Properties'],
        summary: 'List properties',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 25 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by address or city' },
          { name: 'property_type', in: 'query', schema: { type: 'string', enum: ['residential', 'commercial', 'industrial', 'land', 'mixed_use'] } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'borrower_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Property list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Property' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } } },
      },
      post: {
        tags: ['Properties'],
        summary: 'Create property',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['borrower_id', 'property_type', 'address_line1', 'city', 'state', 'zip_code'],
                properties: {
                  borrower_id: { type: 'string', format: 'uuid' },
                  property_type: { type: 'string', enum: ['residential', 'commercial', 'industrial', 'land', 'mixed_use'] },
                  address_line1: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zip_code: { type: 'string' },
                  square_footage: { type: 'number' },
                  year_built: { type: 'integer' },
                  units: { type: 'integer' },
                  occupancy_rate: { type: 'number', minimum: 0, maximum: 100 },
                  noi: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Property created' },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/properties/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Properties'],
        summary: 'Get property with valuations and loans',
        responses: {
          200: { description: 'Property detail' },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: { tags: ['Properties'], summary: 'Update property', responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Properties'], summary: 'Soft-delete property', description: 'Requires admin role', responses: { 200: { description: 'Deleted' } } },
    },
    '/properties/{id}/valuations': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Properties'], summary: 'List valuations', responses: { 200: { description: 'Valuations' } } },
      post: {
        tags: ['Properties'],
        summary: 'Add valuation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['valuation_type', 'value', 'valuation_date'],
                properties: {
                  valuation_type: { type: 'string', enum: ['appraisal', 'bpo', 'avm', 'inspection', 'tax_assessed'] },
                  value: { type: 'number', minimum: 0 },
                  valuation_date: { type: 'string', format: 'date' },
                  appraiser_name: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Valuation recorded' } },
      },
    },

    // ── Loans ─────────────────────────────────────────────────────────────────
    '/loans': {
      get: {
        tags: ['Loans'],
        summary: 'List loans',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['application', 'underwriting', 'approved', 'funded', 'performing', 'watchlist', 'default', 'foreclosure', 'paid_off', 'charged_off'] } },
          { name: 'loan_type', in: 'query', schema: { type: 'string', enum: ['construction', 'bridge', 'permanent', 'mezzanine', 'equity'] } },
          { name: 'borrower_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'loan_number', 'current_balance', 'origination_date', 'interest_rate'] } },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'] } },
        ],
        responses: { 200: { description: 'Loan list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Loan' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } } },
      },
      post: {
        tags: ['Loans'],
        summary: 'Create loan',
        description: 'Requires admin or loan_officer role',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['loan_number', 'borrower_id', 'loan_type', 'committed_amount', 'interest_rate', 'rate_type'],
                properties: {
                  loan_number: { type: 'string' },
                  borrower_id: { type: 'string', format: 'uuid' },
                  property_id: { type: 'string', format: 'uuid' },
                  loan_type: { type: 'string', enum: ['construction', 'bridge', 'permanent', 'mezzanine', 'equity'] },
                  committed_amount: { type: 'number', minimum: 0 },
                  interest_rate: { type: 'number', minimum: 0, maximum: 100 },
                  rate_type: { type: 'string', enum: ['fixed', 'variable'] },
                  origination_date: { type: 'string', format: 'date-time' },
                  maturity_date: { type: 'string', format: 'date-time' },
                  ltv_ratio: { type: 'number' },
                  dscr: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Loan created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Loan' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Borrower not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/loans/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Loans'], summary: 'Get loan with covenants and disbursements', responses: { 200: { description: 'Loan detail' }, 404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } } },
      put: { tags: ['Loans'], summary: 'Update loan', description: 'Requires admin or loan_officer role', responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Loans'], summary: 'Soft-delete loan', description: 'Requires admin role', responses: { 200: { description: 'Deleted' } } },
    },

    // ── Covenants ─────────────────────────────────────────────────────────────
    '/loans/{loanId}/covenants': {
      parameters: [{ name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Covenants'], summary: 'List covenants for a loan', responses: { 200: { description: 'Covenant list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Covenant' } } } } } } } } },
      post: {
        tags: ['Covenants'],
        summary: 'Create covenant',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['covenant_type', 'description', 'frequency'],
                properties: {
                  covenant_type: { type: 'string', enum: ['financial', 'reporting', 'operational', 'insurance'] },
                  description: { type: 'string' },
                  threshold_value: { type: 'number' },
                  threshold_operator: { type: 'string', enum: ['<', '<=', '>', '>=', '='] },
                  frequency: { type: 'string', enum: ['monthly', 'quarterly', 'semi_annual', 'annual', 'one_time'] },
                  next_due_date: { type: 'string', format: 'date' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Covenant created' }, 400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
      },
    },
    '/loans/{loanId}/covenants/{id}': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: { tags: ['Covenants'], summary: 'Get covenant with exceptions', responses: { 200: { description: 'Covenant detail' } } },
      put: { tags: ['Covenants'], summary: 'Update covenant', responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Covenants'], summary: 'Remove covenant', description: 'Requires admin role', responses: { 200: { description: 'Removed' } } },
    },
    '/loans/{loanId}/covenants/{id}/test': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Covenants'],
        summary: 'Test covenant compliance',
        description: 'Records a tested value. If it violates the threshold, status becomes `breach` and an exception is auto-created.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['tested_value'], properties: { tested_value: { type: 'number' }, notes: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Test result with updated covenant' } },
      },
    },
    '/loans/{loanId}/covenants/{id}/exceptions': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Covenants'],
        summary: 'Record a manual exception',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['description'], properties: { description: { type: 'string' }, actual_value: { type: 'number' }, exception_date: { type: 'string', format: 'date' } } } } },
        },
        responses: { 201: { description: 'Exception recorded' } },
      },
    },

    // ── Disbursements ─────────────────────────────────────────────────────────
    '/loans/{loanId}/disbursements': {
      parameters: [{ name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Disbursements'], summary: 'List disbursements', responses: { 200: { description: 'Disbursement list with total_disbursed meta' } } },
      post: {
        tags: ['Disbursements'],
        summary: 'Request a disbursement',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'disbursement_date'],
                properties: {
                  amount: { type: 'number', minimum: 0 },
                  disbursement_date: { type: 'string', format: 'date' },
                  description: { type: 'string' },
                  wire_reference: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Disbursement request created (status: pending)' },
          422: { description: 'Would exceed committed amount', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/loans/{loanId}/disbursements/{id}/approve': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Disbursements'],
        summary: 'Approve a pending disbursement',
        description: 'Requires admin role',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { wire_reference: { type: 'string' } } } } } },
        responses: { 200: { description: 'Approved' }, 422: { description: 'Not in pending status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
      },
    },
    '/loans/{loanId}/disbursements/{id}/disburse': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Disbursements'],
        summary: 'Mark funds as sent, updates loan balance',
        description: 'Requires admin role. Disbursement must be approved first.',
        responses: { 200: { description: 'Disbursed and loan balance updated' }, 422: { description: 'Not in approved status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
      },
    },
    '/loans/{loanId}/disbursements/{id}/cancel': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Disbursements'],
        summary: 'Cancel a pending or approved disbursement',
        responses: { 200: { description: 'Cancelled' }, 422: { description: 'Already disbursed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
      },
    },

    // ── Payments ──────────────────────────────────────────────────────────────
    '/loans/{loanId}/payments': {
      parameters: [{ name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Payments'], summary: 'List payments with totals', responses: { 200: { description: 'Payment list with meta totals' } } },
      post: {
        tags: ['Payments'],
        summary: 'Record a payment',
        description: 'Updates loan current_balance.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['payment_date', 'amount'],
                properties: {
                  payment_date: { type: 'string', format: 'date' },
                  amount: { type: 'number', minimum: 0 },
                  principal: { type: 'number', minimum: 0 },
                  interest: { type: 'number', minimum: 0 },
                  fees: { type: 'number', minimum: 0 },
                  payment_method: { type: 'string' },
                  reference_number: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Payment recorded and balance updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Payment' } } } } } } },
      },
    },
    '/loans/{loanId}/payments/{id}': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: { tags: ['Payments'], summary: 'Get payment', responses: { 200: { description: 'Payment' } } },
      delete: { tags: ['Payments'], summary: 'Reverse payment and restore balance', description: 'Requires admin role', responses: { 200: { description: 'Reversed' } } },
    },

    // ── Portfolio ─────────────────────────────────────────────────────────────
    '/portfolio/summary': {
      get: {
        tags: ['Portfolio'],
        summary: 'Portfolio KPI summary',
        responses: {
          200: {
            description: 'Aggregate totals and breakdowns',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        total_loans: { type: 'integer' },
                        total_committed: { type: 'number' },
                        total_outstanding: { type: 'number' },
                        performing_loans: { type: 'integer' },
                        watchlist_loans: { type: 'integer' },
                        default_loans: { type: 'integer' },
                        avg_interest_rate: { type: 'number' },
                        loans_by_type: { type: 'object', additionalProperties: { type: 'integer' } },
                        loans_by_status: { type: 'object', additionalProperties: { type: 'integer' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/portfolio/performance': {
      get: {
        tags: ['Portfolio'],
        summary: 'Portfolio performance over time',
        parameters: [{ name: 'months', in: 'query', schema: { type: 'integer', default: 12, maximum: 24 }, description: 'Lookback window in months' }],
        responses: {
          200: {
            description: 'Monthly originations, covenant compliance grid, overdue covenants',
          },
        },
      },
    },

    // ── Tasks ─────────────────────────────────────────────────────────────────
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['open', 'in_progress', 'completed', 'cancelled'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] } },
          { name: 'loan_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'assigned_to', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'mine', in: 'query', schema: { type: 'boolean' }, description: 'Return only tasks assigned to current user' },
        ],
        responses: { 200: { description: 'Task list sorted by priority', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Task' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } } },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                  due_date: { type: 'string', format: 'date' },
                  loan_id: { type: 'string', format: 'uuid' },
                  assigned_to: { type: 'string', format: 'uuid' },
                  task_type: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Task created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Task' } } } } } } },
      },
    },
    '/tasks/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Tasks'], summary: 'Get task', responses: { 200: { description: 'Task detail' } } },
      put: {
        tags: ['Tasks'],
        summary: 'Update task',
        description: 'Admin, creator, or assignee can edit.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  status: { type: 'string', enum: ['open', 'in_progress', 'completed', 'cancelled'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  due_date: { type: 'string', format: 'date' },
                  assigned_to: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' }, 403: { description: 'Not creator or assignee', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } },
      },
      delete: { tags: ['Tasks'], summary: 'Delete task', description: 'Requires admin role', responses: { 200: { description: 'Deleted' } } },
    },

    // ── Prolink: Contractors ──────────────────────────────────────────────────
    '/contractors': {
      get: {
        tags: ['Prolink'],
        summary: 'List contractors',
        parameters: [
          { name: 'search',          in: 'query', schema: { type: 'string' }, description: 'Search company or contact name' },
          { name: 'contractor_type', in: 'query', schema: { type: 'string', enum: ['general','electrical','plumbing','framing','roofing','hvac','concrete','masonry','painting','landscaping','other'] } },
          { name: 'status',          in: 'query', schema: { type: 'string', enum: ['active','inactive','suspended','pending_review'] } },
          { name: 'approved_only',   in: 'query', schema: { type: 'boolean' }, description: 'Only return approved vendors' },
          { name: 'page',            in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'per_page',        in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
        ],
        responses: {
          200: { description: 'Contractor list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Contractor' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
        },
      },
      post: {
        tags: ['Prolink'],
        summary: 'Create contractor',
        description: 'Requires admin or loan_officer role. Contractor starts in pending_review status.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['company_name', 'contractor_type'],
                properties: {
                  company_name:          { type: 'string' },
                  dba_name:              { type: 'string' },
                  contractor_type:       { type: 'string', enum: ['general','electrical','plumbing','framing','roofing','hvac','concrete','masonry','painting','landscaping','other'] },
                  license_number:        { type: 'string' },
                  license_state:         { type: 'string' },
                  license_expiry:        { type: 'string', format: 'date' },
                  insurance_carrier:     { type: 'string' },
                  insurance_policy:      { type: 'string' },
                  insurance_expiry:      { type: 'string', format: 'date' },
                  insurance_amount:      { type: 'number' },
                  bond_carrier:          { type: 'string' },
                  bond_number:           { type: 'string' },
                  bond_amount:           { type: 'number' },
                  bond_expiry:           { type: 'string', format: 'date' },
                  tax_id:                { type: 'string' },
                  address_line1:         { type: 'string' },
                  city:                  { type: 'string' },
                  state:                 { type: 'string' },
                  zip_code:              { type: 'string' },
                  primary_contact_name:  { type: 'string' },
                  primary_contact_email: { type: 'string', format: 'email' },
                  primary_contact_phone: { type: 'string' },
                  notes:                 { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Contractor created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Contractor' } } } } } },
        },
      },
    },
    '/contractors/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get:    { tags: ['Prolink'], summary: 'Get contractor',    responses: { 200: { description: 'Contractor detail', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Contractor' } } } } } }, 404: { description: 'Not found' } } },
      put:    { tags: ['Prolink'], summary: 'Update contractor', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Prolink'], summary: 'Deactivate contractor', description: 'Requires admin. Soft delete.', responses: { 200: { description: 'Deactivated' } } },
    },
    '/contractors/{id}/approve': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      post: {
        tags: ['Prolink'],
        summary: 'Approve contractor as vendor',
        description: 'Requires admin. Sets is_approved_vendor=true and status=active.',
        responses: { 200: { description: 'Contractor approved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Contractor' } } } } } } },
      },
    },
    '/contractors/{id}/suspend': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      post: {
        tags: ['Prolink'],
        summary: 'Suspend contractor',
        description: 'Requires admin. Removes approved vendor status.',
        responses: { 200: { description: 'Contractor suspended' } },
      },
    },

    // ── Prolink: Loan Contractors ─────────────────────────────────────────────
    '/loans/{loanId}/contractors': {
      parameters: [{ name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Prolink'],
        summary: 'List contractors on loan',
        responses: { 200: { description: 'Contractors assigned to the loan', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/LoanContractor' } } } } } } } },
      },
      post: {
        tags: ['Prolink'],
        summary: 'Assign contractor to loan',
        description: 'Requires admin or loan_officer. Contractor must belong to same organization.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['contractor_id', 'role'],
                properties: {
                  contractor_id:            { type: 'string', format: 'uuid' },
                  role:                     { type: 'string', enum: ['general_contractor','sub_contractor','architect','engineer','inspector'] },
                  contract_amount:          { type: 'number' },
                  scope_of_work:            { type: 'string' },
                  start_date:               { type: 'string', format: 'date' },
                  expected_completion_date: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Contractor assigned', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/LoanContractor' } } } } } },
          409: { description: 'Contractor already assigned with this role' },
        },
      },
    },
    '/loans/{loanId}/contractors/{id}': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get:    { tags: ['Prolink'], summary: 'Get loan contractor detail', responses: { 200: { description: 'Detail' } } },
      put:    { tags: ['Prolink'], summary: 'Update loan contractor',      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Prolink'], summary: 'Remove contractor from loan', description: 'Requires admin.', responses: { 200: { description: 'Removed' } } },
    },

    // ── Prolink: Draw Requests ────────────────────────────────────────────────
    '/loans/{loanId}/draw-requests': {
      parameters: [{ name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Prolink'],
        summary: 'List draw requests',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft','submitted','inspection_scheduled','inspection_complete','approved','rejected','funded'] } },
        ],
        responses: { 200: { description: 'Draw request list with total funded meta', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/DrawRequest' } }, meta: { type: 'object', properties: { total_funded: { type: 'number' } } } } } } } } },
      },
      post: {
        tags: ['Prolink'],
        summary: 'Create draw request (draft)',
        description: 'Draw number is auto-incremented per loan. Requires admin or loan_officer.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requested_amount'],
                properties: {
                  contractor_id:    { type: 'string', format: 'uuid' },
                  requested_amount: { type: 'number' },
                  requested_date:   { type: 'string', format: 'date' },
                  description:      { type: 'string' },
                  line_items:       { type: 'object', description: 'Freeform line item breakdown' },
                  percent_complete: { type: 'number', minimum: 0, maximum: 100 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Draw request created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/DrawRequest' } } } } } } },
      },
    },
    '/loans/{loanId}/draw-requests/{id}': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get:    { tags: ['Prolink'], summary: 'Get draw request',    responses: { 200: { description: 'Draw request detail' } } },
      put:    { tags: ['Prolink'], summary: 'Update draft',        description: 'Only allowed while status=draft.', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Updated' }, 422: { description: 'Not a draft' } } },
      delete: { tags: ['Prolink'], summary: 'Delete draft',        description: 'Only allowed while status=draft.', responses: { 200: { description: 'Deleted' }, 422: { description: 'Not a draft' } } },
    },
    '/loans/{loanId}/draw-requests/{id}/submit': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: { tags: ['Prolink'], summary: 'Submit draw request for review', responses: { 200: { description: 'Submitted' }, 422: { description: 'Not a draft' } } },
    },
    '/loans/{loanId}/draw-requests/{id}/schedule-inspection': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Prolink'],
        summary: 'Schedule inspection',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['inspector_name','inspection_date'], properties: { inspector_name: { type: 'string' }, inspection_date: { type: 'string', format: 'date' } } } } } },
        responses: { 200: { description: 'Inspection scheduled' }, 422: { description: 'Must be in submitted status' } },
      },
    },
    '/loans/{loanId}/draw-requests/{id}/complete-inspection': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Prolink'],
        summary: 'Complete inspection',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['percent_complete'], properties: { percent_complete: { type: 'number', minimum: 0, maximum: 100 }, inspection_notes: { type: 'string' } } } } } },
        responses: { 200: { description: 'Inspection completed' }, 422: { description: 'Inspection not yet scheduled' } },
      },
    },
    '/loans/{loanId}/draw-requests/{id}/approve': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Prolink'],
        summary: 'Approve draw request',
        description: 'Requires admin. Can approve from submitted or inspection_complete status.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['approved_amount'], properties: { approved_amount: { type: 'number' } } } } } },
        responses: { 200: { description: 'Approved' }, 422: { description: 'Invalid status transition' } },
      },
    },
    '/loans/{loanId}/draw-requests/{id}/reject': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Prolink'],
        summary: 'Reject draw request',
        description: 'Requires admin.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['rejection_reason'], properties: { rejection_reason: { type: 'string' } } } } } },
        responses: { 200: { description: 'Rejected' } },
      },
    },
    '/loans/{loanId}/draw-requests/{id}/fund': {
      parameters: [
        { name: 'loanId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'id',     in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      post: {
        tags: ['Prolink'],
        summary: 'Fund draw request',
        description: 'Requires admin. Marks draw as funded and increments loan current_balance.',
        responses: { 200: { description: 'Funded and loan balance updated' }, 422: { description: 'Must be approved first' } },
      },
    },
  },
};

export default spec;
