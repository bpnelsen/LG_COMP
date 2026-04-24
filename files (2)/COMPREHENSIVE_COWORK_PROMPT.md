# COMPREHENSIVE LANDGORILLA REVERSE ENGINEERING PROMPT
## For Claude Cowork - Complete Product Analysis

---

## MASTER BRIEF

You are conducting a **complete competitive product analysis** of LandGorilla.
Your mission: Become an expert on every aspect of LandGorilla so we can build a superior competing product (LoanScope).

Document everything through direct observation and interaction. This is NOT accessing their code or data—only using the product as a paying customer would.

---

## PHASE 1: SYSTEM INVENTORY & NAVIGATION
**Duration: 30-45 minutes**
**Objective: Map complete product structure**

### 1.1 Initial Application Overview

Start by taking a screenshot of the **main dashboard/home page**.

Document:
```
Application Name: [name as shown]
Version/Build Number: [if visible]
Current User Role: [your account type]
Last Updated: [if shown]
```

### 1.2 Complete Navigation Structure

**Systematically visit every menu item.** Create a hierarchical map:

```
Primary Navigation
├── [Menu Item 1]
│   ├── Sub-feature 1
│   │   └── Actions available
│   ├── Sub-feature 2
│   │   └── Actions available
│   └── [any tertiary navigation]
├── [Menu Item 2]
│   ├── ...
```

For each menu item, document:
- **Menu name** (exactly as shown)
- **Icon** (if present, describe it)
- **Sub-items** (all of them)
- **Keyboard shortcut** (if available)
- **Tooltip/help text** (if present)
- **Visibility conditions** (always visible? conditional?)

### 1.3 Top-Level Controls & Settings

Document:
- **User menu location** (where is profile/logout?)
- **Settings location** (gear icon? menu? location?)
- **Search functionality** (what can be searched?)
- **Quick actions** (any floating buttons, shortcuts, or quick-access areas?)
- **Notifications** (bell icon? alerts? where shown?)
- **Help/Documentation** (? icon? help menu?)

### 1.4 Page Layout Patterns

For each page type, document the standard layout:

**Example template:**
```
Page Type: Property List View
├── Header
│   ├── Title: "Properties"
│   ├── Breadcrumbs: [yes/no] Path: [if yes]
│   └── Action buttons: [list all buttons]
├── Sidebar
│   ├── Filters available: [list all filter options]
│   ├── Can filters be saved: [yes/no]
│   └── Default filter state: [default filters on/off]
├── Main Content Area
│   ├── Data presentation: [table/cards/map/list]
│   ├── Columns/fields shown: [list all]
│   ├── Sorting options: [list sortable columns]
│   └── Row actions: [edit/delete/view/export/etc]
└── Footer/Pagination
    ├── Results per page: [number]
    ├── Total result count visible: [yes/no]
    └── Pagination style: [number buttons/next-prev/infinite scroll]
```

Create this template for:
- Dashboard/home page
- Property list view
- Deal list view  
- Property detail view
- Deal detail view
- Reports view
- Analytics view
- Team/settings view
- Search results view
- Any other major page type

---

## PHASE 2: COMPLETE DATA MODEL DISCOVERY
**Duration: 60-90 minutes**
**Objective: Map all entities, fields, relationships, and data types**

### 2.1 Entity Inventory

**Visit every section and create a new entity from scratch (if possible).**

For EACH entity type (Property, Deal, Team, Loan, etc.):

#### 2.1.1 Entity Basic Info
```
Entity Name: [exact name from UI]
Icon: [how represented]
Singular/Plural: [as shown in UI]
Create action: [where to find + exact button text]
List location: [where to find the list]
Deletable: [yes/no]
Editable: [yes/no]
Archivable: [yes/no]
```

#### 2.1.2 Field Inventory - EXHAUSTIVE

For EACH field in the create/edit form, document:

```
Field Name: [exactly as labeled in UI]
Field ID/Slug: [if visible in HTML, if not say "not visible"]
Field Type: [text/number/date/dropdown/checkbox/radio/file/etc]
Required: [yes/no - test by trying to submit without it]
Input Restrictions: 
  - Max length: [if any]
  - Min value: [if numeric]
  - Max value: [if numeric]
  - Allowed characters: [if restricted]
  - Pattern: [if regex visible]
Validation:
  - What happens if you leave it blank? [error message]
  - What happens if you enter invalid data? [error message]
  - Is validation real-time or on submit? [when]
Default Value: [if any]
Placeholder Text: [if shown]
Help Text/Tooltip: [if present]
Dependencies: [does this field show/hide other fields?]
Options (if dropdown/radio/checkbox):
  - Option 1: [exact text]
  - Option 2: [exact text]
  - [... all options]
  - Can user create new options? [yes/no]
Example Values Shown: [any hints or examples]
Searchable: [can you search/filter by this field?]
Sortable: [can lists be sorted by this?]
Exportable: [does it appear in exports?]
```

#### 2.1.3 For Each Entity, Create This Table

```
| Field Name | Type | Required | Validation | Default | Searchable | Comments |
|---|---|---|---|---|---|---|
| [field] | [type] | [yes/no] | [rules] | [default] | [yes/no] | [notes] |
```

#### 2.1.4 Entity-Specific Sections

For complex entities, document sub-sections:

**Example: Property Entity**
```
Property
├── Basic Information Section
│   ├── Address (required, text)
│   ├── City (required, text)
│   ├── State (required, dropdown)
│   └── [... other fields]
├── Details Section
│   ├── Property Type (required, dropdown)
│   ├── Square Footage (optional, number)
│   └── [... other fields]
├── Valuation Section
│   ├── Estimated Value (optional, currency)
│   ├── Appraisal Date (optional, date)
│   └── [... other fields]
├── Media Section
│   ├── Photos (optional, file upload - multiple?)
│   ├── Documents (optional, file upload - multiple?)
│   └── [... other fields]
└── Status Section
    ├── Status (required, dropdown)
    ├── Listed Date (optional, date)
    └── [... other fields]
```

### 2.2 Data Relationships

For each entity, document relationships to other entities:

```
Property Entity Relationships:
├── Has Many: Deals (one property → multiple deals)
├── Has Many: Photos (one property → multiple photos)
├── Has Many: Documents (one property → multiple documents)
├── Has Many: Notes (one property → multiple notes)
├── Belongs To: [none visible]
└── Many-to-Many: Teams (can be assigned to multiple teams?)

Deal Entity Relationships:
├── Belongs To: Property (each deal is for one property)
├── Has Many: Attachments (documents for this deal)
├── Has Many: Financing Records (multiple loan sources?)
├── Belongs To: User (created by which user?)
└── Shared With: [teams/users] (visibility rules)
```

### 2.3 Status & State Systems

For each entity, document all possible states:

**Example: Deal Status**
```
Deal Status Values:
├── Prospect [what triggers this?]
├── Under Contract [what triggers this?]
├── Active [what triggers this?]
├── Closed [what triggers this?]
├── Dead [what triggers this?]
├── Archived [what triggers this?]

Status Transitions:
├── Prospect → Under Contract [allowed? any warnings?]
├── Under Contract → Active [allowed? requirements?]
├── Active → Closed [allowed? requirements?]
├── Any status → Dead [allowed?]
└── Any status → Archived [allowed?]

Status-Dependent Behavior:
├── If Prospect: Can edit all fields? Can delete? Can export?
├── If Under Contract: Any fields locked?
├── If Closed: Fully read-only?
└── [... for each status]
```

### 2.4 Custom Fields / Extensibility

Document:
- Can users create custom fields? [yes/no]
- If yes, for which entities?
- What types of custom fields are supported?
- Are there any restrictions?
- Where do custom fields appear?

---

## PHASE 3: COMPLETE WORKFLOW DOCUMENTATION
**Duration: 90-120 minutes**
**Objective: Step-by-step guide for every major workflow**

### 3.1 Primary Workflows

For EACH major workflow, create a complete step-by-step guide:

#### Template: [Workflow Name]

```
WORKFLOW: [Name]
Purpose: [What does this accomplish?]
Preconditions: [What must exist before starting?]
Typical User: [Who does this?]
Frequency: [How often is this done?]
Complexity: [Simple/Medium/Complex]

STEP-BY-STEP EXECUTION:

Step 1: [Action]
├── How to initiate: [exactly where to click/what to type]
├── Screenshot saved as: [reference name]
├── Expected result: [what should appear]
└── If error: [common errors and how to fix]

Step 2: [Action]
├── ...

[Continue for all steps until completion]

COMPLETION STATE:
├── How do you know it succeeded? [success indicator]
├── Data created/modified: [what changed in the system]
├── Notifications sent: [any emails/alerts?]
└── Where can you see the result? [where to verify]

VARIATIONS & EDGE CASES:
├── Variation 1: [if you do X instead]
│   └── Differences: [what changes]
├── Variation 2: [another path]
│   └── Differences: [what changes]
├── Error Case 1: [what if X happens]
│   └── Recovery: [how to fix]
└── Error Case 2: [what if Y happens]
    └── Recovery: [how to fix]

RELATED WORKFLOWS:
├── Often followed by: [workflow B]
├── Often preceded by: [workflow A]
└── Can be combined with: [workflow C]

NOTES & OBSERVATIONS:
├── UI quirks: [anything unusual?]
├── Performance: [is it slow? fast?]
├── Confusing elements: [what confused you?]
└── Improvements: [how would you do it better?]
```

### 3.2 Document These Core Workflows

Create complete documentation for:

**Property Management Workflows:**
1. Create a new property
2. View property details
3. Edit property information
4. Upload property photos
5. Upload property documents
6. Add notes to property
7. Delete/archive property
8. Search for properties
9. Filter properties by criteria
10. Export property list
11. Bulk edit properties (if available)
12. Map view (if available)

**Deal Management Workflows:**
1. Create a new deal
2. Associate deal with property
3. Add financing/loan to deal
4. View deal details/analysis
5. Edit deal terms
6. Change deal status
7. Add deal documents
8. Add deal notes
9. Close/archive deal
10. Export deal information
11. Compare multiple deals (if available)

**Financial/Analysis Workflows:**
1. View deal financial analysis
2. View portfolio summary
3. Run custom reports
4. Export financial data
5. Compare financing options (if available)
6. Calculate deal metrics (IRR, ROI, etc)
7. Modify financial assumptions (if allowed)

**Team/Collaboration Workflows:**
1. Invite user to account
2. Set user permissions
3. Assign property to team member
4. Assign deal to team member
5. View user activity
6. Manage user roles

**Administrative Workflows:**
1. Account settings
2. Billing/subscription
3. Integration setup (if available)
4. API key generation (if available)
5. Data export/backup
6. User management

### 3.3 Data Flow Documentation

Create flow diagrams showing how data moves through the system:

```
Property Creation Flow:
┌─ New Property Form
├─ Form Validation (client-side)
├─ Submission
├─ Server Validation (errors shown where?)
├─ Property Record Created
├─ [any automatic actions?]
│  ├─ Send notification?
│  ├─ Update other records?
│  └─ Trigger calculations?
├─ Confirmation message
└─ Redirect to Property Detail

Deal Creation Flow:
┌─ New Deal Form (or existing property → add deal?)
├─ Property Selection (required? dropdown/search?)
├─ Deal Type Selection (required? options?)
├─ Financing Information (optional or required?)
├─ Form Submission
├─ Server Processing
├─ Deal Created
├─ [automatic actions?]
└─ Success & Next Steps

Deal Analysis Calculation Flow:
┌─ User Inputs Property/Deal Data
├─ Client-side Calculations (any?)
├─ Data Submitted
├─ Server-side Calculations
├─ Results Displayed to User
├─ Can user edit inputs to recalculate?
└─ Save/Export Results
```

---

## PHASE 4: DETAILED UI/UX ANALYSIS
**Duration: 45-60 minutes**
**Objective: Understand design patterns and user experience**

### 4.1 Visual Design System

Document the design language:

```
COLOR PALETTE:
├── Primary Brand Color: [hex code if visible, description]
├── Secondary Color: [hex code, description]
├── Accent Color: [hex code, description]
├── Neutral/Gray Scale: [list the grays used]
├── Error/Warning Colors: [colors for errors/warnings]
└── Success Color: [color for success states]

TYPOGRAPHY:
├── Primary Font: [name if visible]
├── Font Sizes: [list the sizes used]
├── Font Weights: [bold, regular, light used?]
├── Letter Spacing: [normal, wide, tight?]
└── Line Height: [generous, standard, tight?]

SPACING & LAYOUT:
├── Padding in containers: [pixel estimates]
├── Margin between sections: [pixel estimates]
├── Column/grid system: [standard spacing unit?]
└── Max content width: [pixel estimate]

ICONOGRAPHY:
├── Icon set used: [Material Design? Custom? Other?]
├── Icon sizes: [list sizes used]
├── Icon colors: [how do icons change color on hover?]
└── Common icons: [document the icons you see]

VISUAL COMPONENTS:
├── Buttons
│   ├── Primary button style: [color, size, shape]
│   ├── Secondary button style
│   ├── Hover state: [how does it change?]
│   ├── Disabled state: [appearance]
│   ├── Loading state: [spinner? text?]
│   └── Button sizes: [small/normal/large]
├── Cards/Containers
│   ├── Shadow style: [drop shadow? inset? flat?]
│   ├── Border radius: [sharp? slightly rounded? very rounded?]
│   ├── Border style: [solid? dashed? none?]
│   └── Spacing inside card
├── Form Elements
│   ├── Input field style
│   ├── Placeholder text color
│   ├── Focus state (what happens when clicked?)
│   ├── Error state (color, icon, text)
│   ├── Checkbox/radio appearance
│   ├── Dropdown appearance
│   └── Disabled field appearance
├── Tables
│   ├── Header row style
│   ├── Row hover: [does row highlight?]
│   ├── Striping: [alternating colors?]
│   ├── Border style
│   └── Text alignment
└── Modals/Dialogs
    ├── Background overlay: [transparent? darkened?]
    ├── Modal size: [width, height]
    ├── Modal position: [centered? top?]
    └── Close button location
```

### 4.2 Interaction Patterns

Document how the app responds to user actions:

```
FORM INTERACTION:
├── Validation Timing
│   ├── Real-time (as you type)? [yes/no]
│   ├── On blur (when you leave field)? [yes/no]
│   ├── On submit only? [yes/no]
│   └── Error message style: [inline/tooltip/top of form?]
├── Required Field Indicators
│   ├── How shown: [red asterisk? "required" text? bold label?]
│   └── Styling: [color, size, position]
├── Success Feedback
│   ├── Checkmark? [yes/no, style]
│   ├── Green highlight? [yes/no]
│   ├── Message? [where, what it says]
│   └── Auto-clear errors? [when?]
└── Form Submission
    ├── Button behavior: [disabled while submitting?]
    ├── Loading state: [spinner? text change?]
    ├── Error handling: [how are submission errors shown?]
    └── Success handling: [message? navigation? notification?]

LIST INTERACTION:
├── Row Selection
│   ├── Hover effect: [highlight? change color?]
│   ├── Selection: [checkbox? click row? shift+click?]
│   ├── Multiple selection: [allowed?]
│   └── Bulk actions: [delete/edit multiple?]
├── Sorting
│   ├── Click column header: [reorder?]
│   ├── Sort direction: [ascending first or descending?]
│   ├── Visual indicator: [arrow? highlight?]
│   ├── Multi-column sort: [possible?]
│   └── Default sort: [which column? direction?]
├── Filtering
│   ├── Where shown: [sidebar? top? inline?]
│   ├── Filter types: [checkboxes? dropdowns? text input? date picker?]
│   ├── Multiple filters: [AND logic? OR logic?]
│   ├── Clear filters: [button available? reset to defaults?]
│   └── Saved filters: [can users save filter sets?]
└── Pagination/Loading
    ├── How shown: [number buttons? next/prev? infinite scroll?]
    ├── Can jump to page: [yes/no?]
    ├── Results per page: [selectable? fixed?]
    └── Total count shown: [yes/no?]

NAVIGATION:
├── Link behavior: [new tab? same window? modal?]
├── Breadcrumbs: [always shown? clickable?]
├── Back button: [where? what does it do?]
├── Search
│   ├── Search location: [top bar? sidebar? dedicated page?]
│   ├── What can be searched: [all entities? specific types?]
│   ├── Search suggestions: [autocomplete? recent searches?]
│   ├── Placeholder text: [what hint is shown?]
│   └── Search results: [how displayed?]
└── Keyboard shortcuts: [any documented?]

FEEDBACK & NOTIFICATIONS:
├── Success messages
│   ├── How shown: [toast/popup? inline? top banner?]
│   ├── Auto-dismiss: [yes? timing?]
│   ├── User can dismiss: [yes? how?]
│   └── Message color: [green? blue?]
├── Error messages
│   ├── How shown: [toast/popup? inline? top banner?]
│   ├── Auto-dismiss: [yes/no?]
│   ├── User can dismiss: [yes/no?]
│   └── Message color: [red? orange?]
├── Warning messages
│   ├── Display method
│   ├── Timing
│   └── Styling
└── Confirmation dialogs
    ├── When shown: [before destructive action? always?]
    ├── Content: [title, message]
    ├── Button labels: [exact text]
    └── Default action: [which button is highlighted?]

MOBILE/RESPONSIVE:
├── How does UI change on mobile? [describe]
├── Sidebar: [shown? hidden? slide-out menu?]
├── Navigation: [hamburger menu? bottom nav? tabs?]
├── Touch targets: [large enough for touch?]
├── Landscape support: [rotate and works?]
└── Responsive breakpoints: [approximate widths where layout changes]
```

### 4.3 Performance & Responsiveness

Test and document:

```
PAGE LOAD TIMES:
├── Dashboard: [estimate time to fully load]
├── Property List: [estimate time, does it stream/paginate?]
├── Deal Detail: [estimate time]
└── Reports: [estimate time, any loading indicators?]

RESPONSIVENESS:
├── Form submission: [instant? any delay?]
├── List sorting: [instant or reload?]
├── Filter application: [instant or reload?]
├── Search: [instant or reload?]
├── Page transitions: [smooth? any fade/loading?]
└── File uploads: [progress shown? time estimate given?]

ANIMATIONS:
├── Page transitions: [fade? slide? instant?]
├── Button interactions: [ripple effect? scale? color change?]
├── Loading indicators: [spinner? progress bar? skeleton loader?]
├── Form errors: [shake? highlight? slide in?]
└── Other animations: [note any you see]
```

---

## PHASE 5: BUSINESS LOGIC & RULES
**Duration: 60-90 minutes**
**Objective: Understand constraints, validations, calculations**

### 5.1 Validation Rules

For each entity type and workflow, document:

```
PROPERTY VALIDATION:
├── Address field
│   ├── Required: [yes/no]
│   ├── Max length: [characters]
│   ├── Format: [any specific format required?]
│   └── Error message: [exact text when invalid]
├── Zip code
│   ├── Required: [yes/no]
│   ├── Format: [5 digits? 9 digits? flexible?]
│   ├── Validation: [checks against database? auto-formats?]
│   └── Error message
├── Square footage
│   ├── Required: [yes/no]
│   ├── Type: [must be number]
│   ├── Min/max: [any limits?]
│   ├── Precision: [decimals allowed?]
│   └── Error message
└── [... all fields]

DEAL VALIDATION:
├── Deal name
│   ├── Requirements: [required? max length? special characters?]
│   ├── Uniqueness: [must be unique? globally? per property?]
│   └── Error message
├── Deal type
│   ├── Required: [yes]
│   ├── Options available: [list all]
│   ├── Can be changed after creation: [yes/no]
│   └── Affects other fields: [which ones?]
├── Property relationship
│   ├── Required: [yes]
│   ├── Selection method: [dropdown? search? browse?]
│   ├── Can be changed later: [yes/no]
│   └── Validation: [can property be deleted if deal exists?]
└── [... all fields]

FINANCING/LOAN VALIDATION:
├── Loan amount
│   ├── Required: [yes/no, depends on what?]
│   ├── Type: [currency]
│   ├── Min/max: [any limits? relative to property value?]
│   ├── Precision: [2 decimals for currency?]
│   └── Error message
├── Interest rate
│   ├── Required: [yes/no]
│   ├── Range: [what min/max?]
│   ├── Precision: [decimal places?]
│   ├── Format: [percentage? decimal?]
│   └── Error message
└── [... all fields]
```

### 5.2 Calculated Fields

Document any fields that are automatically calculated:

```
PROPERTY METRICS:
├── Total Value (if multiple properties)
│   ├── How calculated: [sum of individual values?]
│   ├── Includes what: [appraised value? market value?]
│   ├── Real-time update: [yes, when you change a value?]
│   └── User can override: [yes/no?]
├── Average Price Per Square Foot
│   ├── Formula: [price / square footage]
│   ├── Used where: [display only? filtering? sorting?]
│   └── Precision: [decimal places?]
└── [... other calculated fields]

DEAL METRICS:
├── Days on Market
│   ├── How calculated: [today - listed date?]
│   ├── Displayed where: [list view? detail view?]
│   └── Real-time: [updates daily?]
├── Return on Investment (ROI)
│   ├── Formula: [what inputs? how calculated?]
│   ├── Based on what: [purchase price? deal terms?]
│   ├── User can modify inputs: [yes/no?]
│   └── What-if analysis: [can user change assumptions?]
├── Internal Rate of Return (IRR)
│   ├── Calculation inputs: [what fields?]
│   ├── Assumes what: [cash flows? timing?]
│   ├── Can be customized: [yes/no?]
│   └── Precision: [decimal places?]
├── Debt Service Coverage Ratio (DSCR)
│   ├── Formula: [NOI / debt service?]
│   ├── Based on what data: [property income? loan terms?]
│   ├── User can input: [property NOI? use actuals or projections?]
│   └── Validation: [does it validate against requirements?]
├── Loan to Value (LTV)
│   ├── Formula: [loan / property value?]
│   ├── Which property value: [appraised? market? purchase price?]
│   ├── Real-time update: [when you change property value or loan amount?]
│   └── Display: [percentage? decimal?]
└── [... other calculated fields]

PORTFOLIO METRICS:
├── Total Portfolio Value
│   ├── Calculation: [sum of all property values?]
│   ├── Filters applied: [include archived? specific property types?]
│   └── Currency: [single currency? conversion?]
├── Average Deal Size
│   ├── Calculation: [total value / number of deals?]
│   └── Based on: [current value? original value?]
├── Portfolio Weighted Average
│   ├── What metric: [rate? return?]
│   ├── How weighted: [by deal size? property value?]
│   └── Displayed where: [summary view?]
└── [... other metrics]
```

### 5.3 Business Rules & Constraints

Document the logical rules that govern the system:

```
PROPERTY RULES:
├── Can a property have multiple deals: [yes/no]
├── Can a property be deleted: [always? only if no deals?]
├── Can archived properties be reactivated: [yes/no]
├── Can property type be changed: [always? only if no deals?]
├── Property status rules: [what transitions are allowed?]
└── Photo/document limits: [max number of files?]

DEAL RULES:
├── Can deal be created without property: [yes/no]
├── Can deal property be changed: [after creation?]
├── Can deal type be changed: [after creation?]
├── When can deal be marked closed: [immediate? requirements?]
├── When can deal be deleted: [only when draft? never?]
├── Can closed deals be reopened: [yes/no]
├── Financing requirements: [optional? required for certain deal types?]
├── Can multiple lenders be added: [yes/no]
└── Deal status rules: [what transitions allowed?]

FINANCING/LOAN RULES:
├── Can there be multiple loans per deal: [yes/no]
├── Loan amount constraints: [vs property value? max LTV?]
├── Interest rate constraints: [min/max reasonable bounds?]
├── Loan term constraints: [min/max months?]
├── Can loans be deleted: [yes/no, when?]
├── Can loan terms be modified: [yes/no, after what point?]
├── Does loan require matching property value: [validation?]
└── Covenant requirements: [optional? required fields?]

PERMISSION RULES:
├── Can team member see all properties: [yes/no]
├── Can team member edit all deals: [yes/no]
├── Can team member delete entities: [yes/no]
├── Can team member invite others: [yes/no]
├── Can user delete own account: [yes/no]
├── Roles available: [list all and describe permissions]
└── Can permissions be customized: [yes/no]

DATA CONSISTENCY RULES:
├── If deal is closed, can property be deleted: [yes/no?]
├── If property is deleted, what happens to deals: [cascade delete? prevent delete?]
├── If financing removed, can deal still exist: [yes/no?]
├── If property value changes, are deals updated: [automatically recalculate?]
└── Historical data: [is old data preserved? editable?]
```

### 5.4 Workflow Triggers & Automation

Document any automatic actions:

```
ON DEAL CREATION:
├── Sends notification to: [user? team? property owner?]
├── Updates any fields: [automatically calculates something?]
├── Creates any records: [default covenant? initial timeline?]
└── Modifies other records: [property status? team assignment?]

ON DEAL CLOSURE:
├── Sends notification to: [who?]
├── Calculates final metrics: [final ROI? actual returns?]
├── Archives deal: [immediately? optionally?]
├── Modifies property status: [to what?]
└── Generates reports: [any automatic reports?]

ON PROPERTY CREATION:
├── Default status: [what status do new properties get?]
├── Sends notification: [yes/no to whom?]
├── Requires validation: [address verification? property lookup?]
└── Any pre-filled data: [from lookup service?]

ON FINANCING ADDITION:
├── Calculates metrics: [LTV? DSCR? etc immediately?]
├── Validates against: [property value? deal type? any constraints?]
├── Updates deal view: [shows new metrics immediately?]
├── Sends notification: [yes/no to whom?]
└── Creates records: [any default covenants?]

ON USER INVITATION:
├── Sends email: [yes/no]
├── Email contains: [link? code? instructions?]
├── Pending status: [shows user as pending until they accept?]
├── Auto-assignment: [any default permissions/assignments?]
└── Can inviter track: [status of invitation?]

ON REPORT GENERATION:
├── What data included: [selected properties? all? filtered?]
├── Format available: [PDF? Excel? CSV? all?]
├── Auto-emailed: [to user? to team? scheduled?]
├── Includes charts: [yes, what types?]
└── Formatting: [branded? custom colors? logo?]

SCHEDULED AUTOMATIONS:
├── Daily summary: [sent? to whom? what included?]
├── Weekly report: [sent? to whom? what included?]
├── Portfolio refresh: [metrics recalculated? when?]
├── Data backup: [visible to user? can export?]
└── Cleanup jobs: [any automatic archiving? deletion?]
```

---

## PHASE 6: INTEGRATIONS & EXTENSIBILITY
**Duration: 30-45 minutes**
**Objective: Understand external connections and customization**

### 6.1 External Integrations

Check and document:

```
INTEGRATIONS VISIBLE:
├── Zillow/Property Data: [can look up properties? auto-populate data?]
├── Google Maps: [embedded in UI? links to maps?]
├── Financial Calculators: [external tools? embeds?]
├── Document Services: [DocuSign? e-signature?]
├── Email: [can email from the app? to whom?]
├── Calendar: [Google Calendar? Outlook? sync?]
├── Payment Processing: [Stripe? PayPal? visible?]
├── CRM Integration: [Salesforce? other CRM?]
├── Bank/Accounting: [QuickBooks? Xero? visible?]
├── File Storage: [Google Drive? Dropbox? Box?]
├── Slack/Teams: [notifications to chat?]
└── API: [can external systems connect? documented?]

FOR EACH INTEGRATION:
├── Is it: [built-in? plugin? partner? optional?]
├── How to enable: [automatic? requires setup? API key?]
├── What data syncs: [what information transfers?]
├── Sync direction: [one-way push? two-way? pull?]
├── Frequency: [real-time? daily? on-demand?]
├── User control: [can user configure? disable?]
└── Data visible in app: [how is external data shown?]
```

### 6.2 Customization & Configuration

Document:

```
CUSTOMIZABLE SETTINGS:
├── Account settings
│   ├── Company name: [editable?]
│   ├── Logo/branding: [custom logo? colors?]
│   ├── Timezone: [selectable?]
│   ├── Currency: [default currency?]
│   └── Date format: [configurable?]
├── Notification settings
│   ├── Email notifications: [which ones can be disabled?]
│   ├── Frequency: [immediate? daily digest? weekly?]
│   ├── Recipient: [who gets notifications?]
│   └── Custom alerts: [can user set up custom alerts?]
├── Default values
│   ├── For properties: [any defaults?]
│   ├── For deals: [any defaults?]
│   ├── For financing: [any defaults?]
│   └── For team: [any defaults?]
└── Display preferences
    ├── Items per page: [customizable?]
    ├── Default sorting: [customizable?]
    ├── Theme/dark mode: [available?]
    ├── Sidebar collapsed: [remembered?]
    └── Column visibility: [in lists? customizable?]

EXTENSIBILITY:
├── Custom fields: [can user add custom fields?]
├── Custom statuses: [beyond built-in statuses?]
├── Custom reports: [can user create custom report templates?]
├── Custom workflows: [can user automate custom actions?]
├── Custom roles/permissions: [beyond built-in roles?]
├── API access: [to build custom integrations?]
├── Webhooks: [to receive notifications of changes?]
└── Scripting: [any JavaScript? plugins? extensions?]
```

---

## PHASE 7: ACCOUNT & SECURITY
**Duration: 30-45 minutes**
**Objective: Understand user management and security features**

### 7.1 Account Management

Document:

```
ACCOUNT CREATION:
├── Registration method: [email signup? phone? SSO?]
├── Required information: [what fields?]
├── Email verification: [required? how?]
├── Password requirements: [min length? special chars?]
├── Trial period: [how long? features limited?]
├── Free tier available: [yes/no? limitations?]
└── Payment required: [immediately? after trial?]

ACCOUNT SETTINGS:
├── Profile information editable: [yes/no?]
├── Email change: [allowed? requires verification?]
├── Password change: [how often? requirements?]
├── Account deletion: [allowed? what happens to data?]
├── Data export: [can export data? format?]
├── Two-factor authentication: [available? required?]
└── Login history: [user can see login activity?]

BILLING/SUBSCRIPTION:
├── Pricing plans available: [list them]
├── Features per plan: [what's included in each?]
├── Billing cycle: [monthly? annual? both?]
├── Payment methods: [credit card? bank transfer? other?]
├── Invoice generation: [automatic? downloadable?]
├── Plan upgrades/downgrades: [allowed? when take effect?]
├── Cancellation: [how? immediate? at end of cycle?]
└── Refunds: [available? terms?]
```

### 7.2 Security Features

Document:

```
AUTHENTICATION:
├── Login requirements: [email + password? SSO?]
├── Session timeout: [how long before auto-logout?]
├── Password reset: [email link? security questions?]
├── Multi-factor authentication: [available?]
├── Social login: [Google? Facebook? others?]
├── SSO/SAML: [available? for which plans?]
└── Browser/device recognition: [remember this device?]

DATA PROTECTION:
├── HTTPS/SSL: [all connections encrypted?]
├── Data encryption: [at rest? in transit?]
├── Data location: [where are servers? geographic options?]
├── Backups: [automatic? user-initiated? frequency?]
├── Disaster recovery: [visible backup/restore options?]
└── Data retention: [how long after account deletion?]

PRIVACY & COMPLIANCE:
├── Privacy policy: [link available?]
├── GDPR compliance: [documented?]
├── CCPA compliance: [documented?]
├── HIPAA compliance: [if health-related data?]
├── SOC2 certification: [mentioned?]
├── Compliance documentation: [available?]
└── Data processing agreement: [available?]

AUDIT & LOGGING:
├── User activity logs: [available? to admin?]
├── Change logs: [record what changed, who changed, when?]
├── Login logs: [visible? to user? to admin?]
├── Data access logs: [recorded?]
├── Export logs: [tracked?]
└── Retention: [how long are logs kept?]
```

---

## PHASE 8: REPORTING & ANALYTICS
**Duration: 60-90 minutes**
**Objective: Complete inventory of reports and analytics**

### 8.1 Available Reports

For EACH report type, document:

```
REPORT: [Report Name]

Basic Information:
├── Report name: [exactly as shown in UI]
├── Location: [where to find it]
├── Available for: [properties? deals? portfolio?]
├── Access level: [all users? admin only?]
├── Frequency: [one-time? scheduled?]
└── Required permissions: [what's needed to run?]

Report Contents:
├── What data shown: [list all fields/metrics]
├── Time period: [single date? range? configurable?]
├── Filtering: [by property? by status? by user?]
├── Sorting: [configurable? default sort?]
├── Grouping: [any grouping/subtotals?]
├── Totals/Summaries: [calculations shown?]
└── Charts/Visualizations: [any graphs? maps?]

Export Options:
├── PDF: [available? formatted how?]
├── Excel: [available? includes charts?]
├── CSV: [available? includes headers?]
├── Email: [can be sent? scheduled?]
└── Print: [can print directly from report?]

Customization:
├── Date range: [user selectable?]
├── Filters: [user configurable?]
├── Columns: [user can show/hide?]
├── Sorting: [user can change?]
├── Template: [can save as template?]
└── Scheduling: [can schedule recurring?]

Technical Details:
├── Data sources: [what records included?]
├── Calculation basis: [current values? historical?]
├── Performance: [how long to generate?]
├── Row limit: [any maximum?]
└── Accuracy: [is data real-time?]
```

List these reports:
- Portfolio Summary Report
- Property Performance Report
- Deal Analysis Report
- Financing Overview Report
- Team Activity Report
- Financial Statement/P&L (if available)
- Compliance Report (if available)
- Any custom report options
- Any dashboard/summary views that might be "reports"

### 8.2 Dashboard & Analytics Views

Document:

```
MAIN DASHBOARD:
├── Location: [home page? separate section?]
├── Widgets visible: [list all dashboard widgets]
├── Widget 1: [name, metric, how calculated, interactive?]
├── Widget 2: [... repeat for each]
├── Can customize: [add/remove/reorder widgets?]
├── Data refresh: [real-time? daily? on-demand?]
└── Drill-down: [can click widget to see detail?]

PROPERTIES ANALYTICS:
├── Metrics shown: [list all]
├── Total properties: [count? breakdown by type?]
├── Geographic distribution: [map? by state/city?]
├── Property type breakdown: [pie chart? numbers?]
├── Value trends: [graph over time?]
├── Price per sq ft: [average? comparison?]
└── Customizable: [filter/sort/period?]

DEALS ANALYTICS:
├── Deal count: [total? by status?]
├── Deal values: [total? average? median?]
├── Deal status breakdown: [pie chart? timeline?]
├── Return metrics: [ROI? IRR? shown how?]
├── Time to close: [average? range?]
├── Geographic distribution: [map? by location?]
├── Deal type breakdown: [pie chart?]
├── Performance trends: [trending better/worse?]
└── Comparisons: [this quarter vs last?]

PORTFOLIO ANALYTICS:
├── Total portfolio value: [displayed where?]
├── Asset allocation: [by property type? by location?]
├── Risk metrics: [concentration? diversification?]
├── Performance: [weighted average return?]
├── Forecasts: [projected returns? sensitivity analysis?]
├── Benchmarks: [compared to index? peer group?]
└── Alerts: [if metrics cross thresholds?]

FINANCIAL ANALYTICS:
├── Income metrics: [total rental? potential?]
├── Expense metrics: [by category?]
├── Cash flow: [positive? timing?]
├── Leverage: [avg LTV? debt-to-equity?]
├── Returns: [ROI? multiple? comparison?]
└── Projections: [forward-looking? assumptions visible?]
```

### 8.3 Visualization Types

Document the visualization styles used:

```
CHARTS OBSERVED:
├── Bar charts: [where? horizontal or vertical? colors?]
├── Pie/donut charts: [where? percentage labels?]
├── Line graphs: [where? trends? multiple lines?]
├── Area charts: [where? stacked?]
├── Maps: [geographic data? heat map? markers?]
├── Tables: [formatted how? sortable?]
├── Cards/tiles: [metrics displayed as cards?]
├── Gauges: [progress indicators? performance?]
├── Waterfall charts: [revenue breakdowns?]
└── Other: [any other chart types?]

CHART INTERACTIONS:
├── Hover tooltips: [show data on hover?]
├── Drill-down: [click to see detail?]
├── Filter: [click legend to show/hide?]
├── Zoom: [can zoom in on chart?]
├── Export: [download chart as image?]
├── Legend: [interactive? clickable?]
└── Time range: [slider to change period?]
```

---

## PHASE 9: PERFORMANCE, LIMITATIONS & EDGE CASES
**Duration: 45-60 minutes**
**Objective: Discover constraints and how app handles problems**

### 9.1 Performance Characteristics

Document:

```
LOAD TIMES:
├── Application startup: [measure page load time]
├── Dashboard load: [measure time to fully interactive]
├── List views: [property list? deal list? how fast?]
├── Detail pages: [property detail? deal detail?]
├── Report generation: [various reports? timing?]
├── Search queries: [how fast? any lag?]
├── Filter application: [instant or reload needed?]
└── File uploads: [how long for photos? documents?]

CONCURRENT USER IMPACT:
├── Multiple tabs: [performance hit? noticeable?]
├── Multiple windows: [consistent? any conflicts?]
├── Real-time sync: [if change in one tab, reflects in others?]
├── Session conflict: [what if same record edited simultaneously?]
└── API rate limits: [any visible throttling?]

BROWSER/DEVICE COMPATIBILITY:
├── Chrome: [fully functional? version tested?]
├── Safari: [fully functional? version tested?]
├── Firefox: [fully functional? version tested?]
├── Edge: [fully functional? version tested?]
├── Mobile browsers: [fully functional?]
├── Older browsers: [graceful degradation?]
├── Desktop app: [separate app? Electron? web-based?]
└── Mobile app: [iOS? Android? features parity?]

NETWORK CONDITIONS:
├── Offline behavior: [what happens? queuing? message?]
├── Slow network: [graceful degradation? loading states?]
├── Connection loss: [error handling? reconnect attempt?]
├── Large datasets: [pagination? virtual scroll? limits?]
└── File upload failures: [retry? partial upload?]
```

### 9.2 Limitations & Constraints

Test and document:

```
DATA LIMITS:
├── Maximum properties: [any limit? what happens if exceeded?]
├── Maximum deals: [any limit?]
├── Maximum file size: [per upload? total?]
├── Maximum file count: [per property? per deal?]
├── Maximum users: [per account? plan-dependent?]
├── Field length limits: [character limits?]
├── Numeric precision: [decimal places? number range?]
├── Date range: [how far back? future?]
└── Name/identifier length: [max characters?]

FEATURE LIMITS BY PLAN:
├── Free tier: [features available? limits?]
├── Pro tier: [what's included? user limit? storage?]
├── Enterprise tier: [what's included? support?]
└── Add-ons: [available? costs?]

OPERATIONAL CONSTRAINTS:
├── Data retention: [how long kept after deletion?]
├── Bulk operations: [max items in bulk update?]
├── Report rows: [maximum rows in report?]
├── Export size: [max export size?]
├── API rate limits: [requests per minute/hour/day?]
└── Concurrent API calls: [limits?]

FEATURE AVAILABILITY:
├── Feature X: [available to all? certain plans? certain roles?]
├── Feature Y: [beta? coming soon? deprecated?]
├── Feature Z: [regional restrictions?]
└── [... note any feature availability]
```

### 9.3 Error Handling & Edge Cases

Test these scenarios and document:

```
FORM SUBMISSION ERRORS:
├── Submit with required field empty: [error message?]
├── Submit with invalid email: [message?]
├── Submit with invalid number: [message?]
├── Submit with duplicate name: [message?]
├── Submit with oversized file: [message?]
├── Network error during submit: [retry? message?]
├── Server error (500): [message? recovery?]
└── Timeout: [message? retry option?]

NAVIGATION ERRORS:
├── Direct URL to deleted record: [404? message? redirect?]
├── URL with invalid ID: [error? redirect?]
├── Insufficient permissions: [403? message?]
├── Session expired: [redirect to login?]
└── Browser back button: [works? any warnings?]

DATA CONFLICTS:
├── Record edited by another user: [notification? overwrite? merge?]
├── Batch operation partially fails: [transaction? rollback?]
├── Dependent record deleted: [error? cascade delete?]
├── Status validation fails: [error? message?]
└── Business rule violated: [message? prevention?]

EDGE CASES:
├── Zero values: [allowed? displayed? calculated correctly?]
├── Very large numbers: [formatting? overflow?]
├── Special characters in names: [allowed? escaped? display correctly?]
├── Unicode/international chars: [supported?]
├── Empty search results: [message shown? suggestions?]
├── Very long data: [truncated? tooltip? scroll?]
├── Multiple file uploads: [concurrent? sequential? limit?]
└── Rapid clicking: [debounced? prevents duplicates?]

RECOVERY & UNDO:
├── Delete operation: [undo available?]
├── Edit operation: [undo available?]
├── Bulk operation: [undo available?]
├── How long available: [immediately? permanently?]
├── Trash/archive: [soft delete? recoverable?]
└── Manual recovery: [contact support?]
```

---

## PHASE 10: COMPETITIVE ANALYSIS & FEATURE PRIORITIES
**Duration: 30-45 minutes**
**Objective: Strategic assessment for building LoanScope**

### 10.1 Strengths & Weaknesses

Document your assessment:

```
LANDGORILLA STRENGTHS:
├── Feature 1: [why is this strong?]
├── Feature 2: [user experience? completeness?]
├── Feature 3: [reporting? analytics?]
├── Performance: [speed? reliability?]
├── UX/Design: [intuitive? polished?]
├── Documentation: [helpful? complete?]
├── Support: [responsive? knowledgeable?]
└── Integrations: [what third-party tools?]

LANDGORILLA WEAKNESSES:
├── Missing feature 1: [users mention this gap?]
├── Missing feature 2: [compliance? financial modeling?]
├── Poor UX in area: [which workflow is confusing?]
├── Limited reporting: [what's not reported?]
├── No API/integrations: [can't connect to other tools?]
├── Pricing: [expensive? per-user cost?]
├── Support: [slow? unhelpful?]
├── Documentation: [sparse? outdated?]
└── Performance: [slow? unreliable?]

FEATURE OPPORTUNITY MAP:
├── High Impact, Easy to Build
│   ├── [feature X]
│   ├── [feature Y]
│   └── [feature Z]
├── High Impact, Hard to Build
│   ├── [feature A]
│   ├── [feature B]
│   └── [feature C]
├── Low Impact, Easy to Build
│   ├── [feature M]
│   └── [feature N]
└── Low Impact, Hard to Build
    └── [feature Z - skip these]

DIFFERENTIATION OPPORTUNITIES:
├── Compliance Focus: [build regulatory features they lack?]
├── Financial Modeling: [deeper financial analysis?]
├── Portfolio Management: [multi-property analytics?]
├── Team Collaboration: [better workflow tools?]
├── Mobile: [better mobile experience?]
├── Integrations: [connect to other lender systems?]
├── Open Source: [community-driven development?]
└── Pricing: [lower cost? usage-based?]
```

### 10.2 Build Priority Matrix

Create a roadmap:

```
IMMEDIATE WINS (Build First):
1. [Feature] - Why: impacts X%, easy to implement, differentiator
2. [Feature] - Why: users ask for this, quick win
3. [Feature] - Why: competitive necessity

PHASE 2 FEATURES (Build Next):
1. [Feature] - Why: strategic advantage
2. [Feature] - Why: market demand
3. [Feature] - Why: necessary for enterprise adoption

PHASE 3+ FEATURES (Nice to Have):
1. [Feature] - Why: future enhancement
2. [Feature] - Why: emerging need
3. [Feature] - Why: market expansion

FEATURES TO SKIP:
1. [Feature] - Why: LandGorilla does it well, not differentiating
2. [Feature] - Why: low user demand
3. [Feature] - Why: too much effort for limited gain
```

---

## FINAL DELIVERABLE CHECKLIST

After completing all phases, compile:

```
DOCUMENTATION PACKAGE:

✅ Navigation & Structure Map
   ├── Complete menu hierarchy
   ├── Page layout diagrams
   └── User flows for key workflows

✅ Data Model Specification
   ├── Entity relationship diagram (inferred)
   ├── Field inventory (all fields, types, validation)
   ├── Data relationships & constraints
   ├── Calculated fields & formulas
   └── Status & workflow states

✅ Complete Workflow Documentation
   ├── Step-by-step guides for 20+ workflows
   ├── Data flow diagrams
   ├── Error handling procedures
   └── Edge cases & variations

✅ UI/UX Design Specification
   ├── Color palette & typography
   ├── Component library (buttons, forms, etc)
   ├── Layout patterns & grids
   ├── Interaction patterns
   └── Responsive design notes

✅ Business Logic & Rules
   ├── Validation rules (all fields)
   ├── Calculated fields & formulas
   ├── Business rule constraints
   ├── Permission model
   └── Automation triggers

✅ Feature Inventory
   ├── Complete feature list
   ├── Availability by plan
   ├── Permission requirements
   └── Dependencies

✅ Report & Analytics Catalog
   ├── All available reports
   ├── Dashboard configuration
   ├── Visualization types
   └── Customization options

✅ Competitive Analysis
   ├── Strengths & weaknesses
   ├── Feature comparison matrix
   ├── Differentiation opportunities
   └── Build priority roadmap

✅ Screenshots & Visual References
   ├── Screen captures (key pages)
   ├── UI pattern examples
   ├── Error message catalog
   └── Success state examples
```

---

## INSTRUCTIONS FOR COWORK

When running this analysis, approach it systematically:

1. **Complete each phase fully** - Don't skip sections
2. **Take screenshots** - As visual reference material
3. **Test everything** - Don't just observe, interact with forms, buttons, workflows
4. **Document exact text** - Copy field names, labels, error messages exactly
5. **Note timing** - How long things take to load/process
6. **Try to break it** - What happens if you enter bad data? How does it fail gracefully?
7. **Observe patterns** - Do UI patterns repeat? How consistent is the design?
8. **Test on multiple resolutions** - How does it look on different screen sizes?
9. **Be thorough** - Spend time on each phase rather than rushing
10. **Consolidate findings** - Create the master documentation at the end

---

## FINAL OUTPUT

After all 10 phases, create a **Master Product Specification** document that includes:

- Executive summary (what is LandGorilla, how it works)
- Complete feature list with functionality
- Data model diagram
- UI/UX style guide
- Complete workflow documentation
- Business rules & validation spec
- Competitive analysis & recommendations
- Prioritized roadmap for LoanScope
- Visual references & screenshots
- Detailed comparison: LandGorilla vs. LoanScope features

This becomes your complete blueprint for building LoanScope to exceed LandGorilla.

---

## SUCCESS CRITERIA

You have successfully reverse-engineered LandGorilla when:

✅ You can create a new property from scratch without guidance
✅ You can create a deal and understand all the fields and their purposes
✅ You understand how financing integrates with deals
✅ You know every feature and where to find it
✅ You can explain the business rules and constraints
✅ You can describe the data model accurately
✅ You can identify 5-10 significant feature gaps
✅ You have a clear roadmap for building LoanScope
✅ You understand their UX patterns and can decide whether to copy or improve them
✅ You can write a competitive analysis that accurately positions LoanScope vs LandGorilla

---

**Now, with this prompt, have Cowork spend 3-4 hours analyzing LandGorilla and provide you with the complete master specification.**

**This becomes your product blueprint for building LoanScope.**
