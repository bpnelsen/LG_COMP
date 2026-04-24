# QUICK REFERENCE: Running Your Cowork Analysis

## Before You Start

### Requirements
- ✅ Claude Desktop with Cowork enabled
- ✅ Active LandGorilla account (paid or trial)
- ✅ Time: 3-4 hours uninterrupted (or split into 2-3 sessions)
- ✅ Computer screen at least 1920x1080 for clarity

### Setup
1. Open Claude Desktop
2. Start a new Cowork session
3. Open LandGorilla in a browser (doesn't need to be Cowork's browser)
4. Position windows so you can see both Cowork and LandGorilla

---

## The Analysis (3-4 Hours)

### Phase 1: Navigation (30-45 min)
```
Tell Cowork:

"I'm going to have you analyze LandGorilla completely. 
First, map out the entire application structure.

Visit every single menu item and sub-feature. For each one:
1. Take a screenshot
2. List the sub-items
3. Note any buttons or actions available

Create a hierarchical menu map showing everything."
```

**What you'll get:** Complete navigation structure

### Phase 2: Data Model (60-90 min)
```
Tell Cowork:

"Now let's understand their data model. 
I'll walk through creating different entities.

For each one, document every field:
- Field name (exactly as labeled)
- Field type (text, number, date, dropdown, etc)
- Is it required? (test by submitting empty)
- What validation happens? (required? format? length?)
- Default value? (if any)
- Options (if dropdown/radio)

Create a detailed field inventory table for:
1. Property (all fields)
2. Deal (all fields)  
3. Financing/Loan (all fields)
4. Any other major entities

Focus on being thorough - don't skip fields."
```

**What you'll get:** Complete data model specification

### Phase 3: Workflows (90-120 min)
```
Tell Cowork:

"Now I need step-by-step documentation of key workflows.

For each workflow, document:
1. Starting state (what must exist first?)
2. Every click, form field, and button (in order)
3. What data is entered (exactly)
4. What happens on submit (success? errors?)
5. Final state (how do you verify it worked?)
6. Any variations or edge cases

Document these workflows:
- Create a property
- Create a deal
- Add financing to a deal
- View a property
- View a deal
- Filter/search properties
- Run a report (any report)
- Add a team member
- [any other major workflows]

Create step-by-step guides I could give to a new user."
```

**What you'll get:** Complete workflow documentation

### Phase 4: UI/UX (45-60 min)
```
Tell Cowork:

"Analyze the user interface design.

Document:
1. Colors used (brand colors, action colors, error colors)
2. Typography (fonts, sizes, weights)
3. Button styles (primary, secondary, hover effects)
4. Form field styles (input, dropdown, checkbox appearance)
5. Common UI patterns (modals, cards, tables)
6. Layout structure (where are things positioned?)
7. How it looks on mobile (if you can test)

Create a design system document so we can match their aesthetic 
(or improve upon it) in our own app."
```

**What you'll get:** Complete design specification

### Phase 5: Business Rules (60-90 min)
```
Tell Cowork:

"Now document the business logic and rules.

Test these things:
1. Validation: Try submitting forms with bad data. What errors appear?
2. Constraints: Are there limits? (max properties? max file size?)
3. Dependencies: When you change one field, does another update?
4. Automations: When you do X, does Y happen automatically?
5. Permissions: What can different user roles do?
6. Status transitions: Can you change status from A to B? Any restrictions?
7. Calculations: Are any values automatically calculated?

Create a comprehensive business rules document."
```

**What you'll get:** Business logic specification

### Phase 6: Reports (30-45 min)
```
Tell Cowork:

"List and document all available reports.

For each report:
1. What's it called?
2. What data does it show?
3. What filtering/customization is available?
4. What formats can you export? (PDF, Excel, CSV?)
5. Are there charts/visualizations?
6. Can it be scheduled/emailed?

Also check if there's a dashboard with metrics/widgets.
What metrics are shown? How are they calculated?"
```

**What you'll get:** Reports & analytics inventory

### Phase 7: Integration & Settings (30-45 min)
```
Tell Cowork:

"Check for integrations, customization, and account settings.

Document:
1. Account settings page (what can be customized?)
2. Any third-party integrations (Zillow? Maps? Email?)
3. API access (is there an API?  Documentation?)
4. Custom fields (can users create custom fields?)
5. Billing/subscription (what plans? features per plan?)
6. Security features (2FA? SSO? data encryption mentioned?)

Create an integrations & extensibility guide."
```

**What you'll get:** Integration specifications

### Phase 8: Competitive Analysis (30-45 min)
```
Tell Cowork:

"Final step: competitive analysis.

Based on everything you've learned:
1. What are their top 3 strengths?
2. What are their top 3 weaknesses (missing features)?
3. What could we build that's better?
4. What features are must-haves (parity)?
5. What features would differentiate us?

Create a prioritized roadmap:
- Must-build (for feature parity)
- Should-build (for competitive advantage)
- Nice-to-have (future enhancements)
- Skip (they do it well, not a priority)"
```

**What you'll get:** Competitive positioning & roadmap

---

## What Cowork Will Output

After each phase, you'll get:
- ✅ Detailed documentation
- ✅ Tables/matrices
- ✅ Screenshots (or references to them)
- ✅ Step-by-step guides
- ✅ Lists of findings

**Total volume:** ~10,000-15,000 words of detailed specifications

---

## After Cowork Finishes

### Consolidate Everything
1. Copy all Cowork output
2. Organize by category (navigation, data model, workflows, etc)
3. Create a "Master Product Specification" document
4. Add visual references (screenshots, diagrams)

### Create Your Build Roadmap
```
Based on Cowork's analysis:

IMMEDIATE BUILD (MVP Parity):
├── Properties management (like LandGorilla)
├── Deals management (like LandGorilla)
├── Basic financing (like LandGorilla)
└── Portfolio dashboard (like LandGorilla)

DIFFERENTIATORS (Phase 2):
├── Loan covenant tracking (they don't have this)
├── Compliance monitoring (they don't have this)
├── Advanced financial modeling (better than theirs)
└── Regulatory reporting (CRA, HMDA, etc)

ADVANTAGES (Phase 3+):
├── Open source (their product is proprietary)
├── Better API (integration friendly)
├── Lending specialist (their product is generalist)
└── Community-driven (their product is closed)
```

### Start Building
Now you have:
- ✅ Complete feature specification
- ✅ Data model diagram
- ✅ UI/UX patterns to follow
- ✅ Step-by-step workflows documented
- ✅ Business rules defined
- ✅ Competitive analysis
- ✅ Prioritized roadmap

**You're ready to build LoanScope.**

---

## Pro Tips

### Session Management
- **Split into 2-3 sessions** if 4 hours is too long
- **Session 1:** Phases 1-2 (navigation & data model)
- **Session 2:** Phases 3-4 (workflows & UI)
- **Session 3:** Phases 5-8 (rules, reports, analysis)

### Keep Cowork Focused
- **One phase at a time** - Don't jump around
- **Stop and ask for consolidation** - After each phase, ask Cowork to summarize findings
- **Request specific output** - If Cowork is rambling, say "Give me a table format for this"
- **Copy-paste findings** - Save each phase output to a document as you go

### If Cowork Gets Stuck
- **Take a screenshot** - Show Cowork what you're looking at
- **Give more context** - "I'm on the Deal details page. I see these fields..."
- **Simplify the ask** - "Just list all the form fields you see"
- **Try a different approach** - "Instead of documenting, just show me a table"

### Verify Understanding
At the end of each phase, ask Cowork:
```
"Create a summary checklist. Have we documented:
- [ ] All fields/entities?
- [ ] All workflows?
- [ ] All edge cases?
- [ ] All UI patterns?
- [ ] All business rules?

Anything missing?"
```

---

## Using Your Output

### For Building
- **Data Model** → Becomes your database schema
- **Workflows** → Guides your feature development
- **UI Patterns** → Informs your design system
- **Business Rules** → Becomes your validation logic
- **Competitive Analysis** → Informs prioritization

### For Roadmap
- **Feature Parity** → MVP must-haves
- **Differentiators** → Phase 2 features
- **Competitive Advantages** → Long-term strategy

### For Communication
- **Specification Document** → Show investors/team
- **Competitive Analysis** → Pitch your advantage
- **Roadmap** → Development planning

---

## Success Looks Like

After Cowork finishes, you should be able to:

✅ Describe every feature of LandGorilla
✅ Draw their data model on a whiteboard
✅ Walk through any workflow step-by-step
✅ Explain their business rules
✅ Identify 5+ ways to differentiate LoanScope
✅ Have a prioritized roadmap (build order)
✅ Know exactly what to build next

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|-----------|
| 1: Navigation | 45 min | 45 min |
| 2: Data Model | 75 min | 2 hrs |
| 3: Workflows | 105 min | 3:45 |
| 4: UI/UX | 45 min | 4:30 |
| 5: Rules | 75 min | 5:45 |
| 6: Reports | 45 min | 6:30 |
| 7: Integration | 40 min | 7:10 |
| 8: Analysis | 45 min | 8:00 |

**Total: ~8 hours of Cowork analysis** (can be split over multiple sessions)

---

## Start Command

When you're ready, copy everything from `COMPREHENSIVE_COWORK_PROMPT.md` and paste it into Cowork:

```
[Copy the entire prompt from COMPREHENSIVE_COWORK_PROMPT.md]

Paste into Cowork and start with:
"I've given you a comprehensive brief for analyzing LandGorilla.
Start with PHASE 1 and work through systematically.
Take your time. Be thorough. Document everything.
Let's start - begin with Phase 1."
```

Then Cowork takes it from there. You can monitor progress, but it will work largely autonomously.

---

## Questions to Ask Cowork Between Phases

```
"Based on what you've learned so far in [previous phases],
what would you prioritize for us to build in our competing product?"

"Are there any features that seem overly complex? 
Any that seem poorly designed that we could do better?"

"What patterns are consistent? 
What patterns would you recommend we improve?"

"If you were a user, what would frustrate you about LandGorilla?"
```

These help Cowork synthesize insights beyond just documentation.

---

**Now you're ready to run the analysis. Good luck! 🚀**
