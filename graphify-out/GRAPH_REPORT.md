# Graph Report - D:/Zojon Digital/Doel-Express-ERP  (2026-05-19)

## Corpus Check
- Corpus is ~37,970 words - fits in a single context window. You may not need a graph.

## Summary
- 393 nodes · 549 edges · 21 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_PHP Auth & RBAC|PHP Auth & RBAC]]
- [[_COMMUNITY_Core App State & API Integration|Core App State & API Integration]]
- [[_COMMUNITY_PHP Infrastructure (DBResponseUtils)|PHP Infrastructure (DB/Response/Utils)]]
- [[_COMMUNITY_App Data Handlers|App Data Handlers]]
- [[_COMMUNITY_Auth Routes & DB Tables|Auth Routes & DB Tables]]
- [[_COMMUNITY_Coach & Counter CRUD|Coach & Counter CRUD]]
- [[_COMMUNITY_DB Schema Setup|DB Schema Setup]]
- [[_COMMUNITY_Database Wrapper (PDO)|Database Wrapper (PDO)]]
- [[_COMMUNITY_Dual Backend (DevProd Sync)|Dual Backend (Dev/Prod Sync)]]
- [[_COMMUNITY_Pagination Utility|Pagination Utility]]
- [[_COMMUNITY_Finance Component Logic|Finance Component Logic]]
- [[_COMMUNITY_User Management|User Management]]
- [[_COMMUNITY_HR Module|HR Module]]
- [[_COMMUNITY_Dev Server (Node.js)|Dev Server (Node.js)]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `Response` - 48 edges
2. `Utils` - 21 edges
3. `App (Root Component)` - 21 edges
4. `Language Type (en|bn)` - 16 edges
5. `Schema` - 13 edges
6. `Database` - 12 edges
7. `Schema Class (DB Table Setup)` - 12 edges
8. `AppRole Enum` - 11 edges
9. `Trip Interface` - 10 edges
10. `Ticket Sales Record Component` - 10 edges

## Surprising Connections (you probably didn't know these)
- `doel_coaches Table` --semantically_similar_to--> `Coach Interface`  [INFERRED] [semantically similar]
  api/schema.php → types.ts
- `doel_trips Table` --semantically_similar_to--> `Trip Interface`  [INFERRED] [semantically similar]
  api/schema.php → types.ts
- `doel_inventory Table` --semantically_similar_to--> `InventoryItem Interface`  [INFERRED] [semantically similar]
  api/schema.php → types.ts
- `doel_transactions Table` --semantically_similar_to--> `Transaction Interface`  [INFERRED] [semantically similar]
  api/schema.php → types.ts
- `doel_staff Table` --semantically_similar_to--> `Staff Interface`  [INFERRED] [semantically similar]
  api/schema.php → types.ts

## Hyperedges (group relationships)
- **Frontend Type System** — types_AppRole, types_User, types_Coach, types_Trip, types_Transaction, types_InventoryItem, types_Staff, types_TicketSalesRecord, types_Counter [EXTRACTED 1.00]
- **Role-Based Access Control System** — types_AppRole, constants_PERMISSIONS, app_hasPermission, server_authorize, api_helpers_Auth [INFERRED 0.95]
- **Dual Backend Architecture (Dev/Prod)** — server_express, server_dbJson, api_index, api_db, api_db_config [INFERRED 0.95]
- **MySQL Database Tables** — api_schema_doel_users, api_schema_doel_transactions, api_schema_doel_ticket_sales, api_schema_doel_staff, api_schema_doel_coaches, api_schema_doel_trips, api_schema_doel_counters, api_schema_doel_notifications, api_schema_doel_inventory [EXTRACTED 1.00]
- **Mock Seed Data (Dev Fixtures)** — constants_MOCK_COACHES, constants_MOCK_TRIPS, constants_MOCK_INVENTORY, constants_MOCK_FINANCE, constants_MOCK_STAFF, constants_MOCK_TICKET_SALES, constants_MOCK_COUNTERS [EXTRACTED 1.00]
- **Bilingual i18n System (EN/BN)** — translations_translations, translations_Language, app_App [EXTRACTED 1.00]
- **App Global State Entities** — app_App, types_Coach, types_Trip, types_Transaction, types_InventoryItem, types_Staff, types_TicketSalesRecord, types_Counter, types_User [EXTRACTED 1.00]
- **Core ERP Data Consumer Components** — dashboard_DashboardComponent, finance_FinanceComponent, reports_ReportsComponent [INFERRED 0.95]
- **Fleet Management Module Cluster** — coachregister_CoachRegister, scheduling_SchedulingComponent, tracking_TrackingComponent, maintenance_MaintenanceComponent [INFERRED 0.95]
- **Staff and Ticketing Cluster** — hr_HRComponent, ticketsales_TicketSalesRecord, counter_CounterManagement [INFERRED 0.85]
- **Role-Based Access Control Cluster** — usermgmt_UserManagement, sidebar_SidebarComponent, settings_SettingsComponent, arch_RBAC, types_AppRole, constants_PERMISSIONS [EXTRACTED 1.00]
- **Bilingual i18n Adoption** — login_LoginComponent, dashboard_DashboardComponent, finance_FinanceComponent, hr_HRComponent, counter_CounterManagement, settings_SettingsComponent, sidebar_SidebarComponent, usermgmt_UserManagement, ticketsales_TicketSalesRecord, inventory_InventoryComponent, maintenance_MaintenanceComponent, reports_ReportsComponent, scheduling_SchedulingComponent, tracking_TrackingComponent, coachregister_CoachRegister, translations_Language [EXTRACTED 1.00]
- **PHP API Backend Callers** — finance_FinanceComponent, hr_HRComponent, ticketsales_TicketSalesRecord, api_finance_report, api_finance_export, api_staff, api_sales_export [EXTRACTED 1.00]
- **Auth Route CRUD Operations** — auth_handleAuth, auth_handleLogin, auth_handleRegister, auth_doel_users_table [EXTRACTED 1.00]
- **Coaches Route CRUD Operations** — coaches_handleCoachList, coaches_handleCoachGet, coaches_handleCoachCreate, coaches_handleCoachUpdate, coaches_handleCoachDelete, coaches_doel_coaches_table [EXTRACTED 1.00]
- **Counters Route CRUD Operations** — counters_handleCounterList, counters_handleCounterGet, counters_handleCounterCreate, counters_handleCounterUpdate, counters_handleCounterDelete, counters_doel_counters_table [EXTRACTED 1.00]
- **Finance Route CRUD Operations** — finance_handleFinanceReport, finance_handleFinanceTransaction, finance_handleFinanceUpdate, finance_handleFinanceDelete, finance_doel_transactions_table [EXTRACTED 1.00]
- **Sales Route CRUD and Export Operations** — sales_handleSalesRecords, sales_handleSalesCreate, sales_handleSalesExport, sales_handleSalesUpdate, sales_handleSalesDelete, sales_doel_ticket_sales_table [EXTRACTED 1.00]
- **Staff Route CRUD Operations** — staff_handleStaffList, staff_handleStaffGet, staff_handleStaffCreate, staff_handleStaffUpdate, staff_handleStaffDelete, staff_doel_staff_table [EXTRACTED 1.00]
- **Trips Route CRUD Operations** — trips_handleTripList, trips_handleTripGet, trips_handleTripCreate, trips_handleTripUpdate, trips_handleTripDelete, trips_doel_trips_table [EXTRACTED 1.00]
- **User Management Route CRUD with Super Admin Guard** — users_handleUserList, users_handleUserCreate, users_handleUserUpdate, users_handleUserDelete, users_super_admin_guard, auth_doel_users_table [EXTRACTED 1.00]
- **Shared PHP Utility Classes Used Across All Routes** — shared_auth_class, shared_utils_class, shared_response_class, shared_allowed_roles_const [EXTRACTED 1.00]
- **Production Data Persistence and Sync Problems** — problems_non_persistent_storage, problems_frontend_state_loss, problems_cross_pc_sync, problems_multi_user_concurrency [EXTRACTED 1.00]
- **Forecast Depends on Finance Transaction Data** — forecast_handleRevenueForecast, finance_doel_transactions_table, finance_handleFinanceReport [INFERRED 0.85]

## Communities (41 total, 13 thin omitted)

### Community 0 - "PHP Auth & RBAC"
Cohesion: 0.04
Nodes (46): Auth, Response, Utils, handleAuth(), handleLogin(), handleRegister(), handleCoachCreate(), handleCoachDelete() (+38 more)

### Community 1 - "Core App State & API Integration"
Cohesion: 0.08
Nodes (56): API /api/finance/export, API /api/finance/report, API /api/sales/export, API /api/staff, App (Root Component), addTicketRecord, finalizeTripIntoSales, handleDataReset (Factory Reset) (+48 more)

### Community 2 - "PHP Infrastructure (DB/Response/Utils)"
Cohesion: 0.06
Nodes (39): Database Class (PHP PDO Singleton), db.config.php (Production Credentials), Auth Class (PHP), Response Class (PHP), Utils Class (PHP), PHP API Router (index.php), Schema Class (DB Table Setup), doel_coaches Table (+31 more)

### Community 3 - "App Data Handlers"
Cohesion: 0.06
Nodes (8): addCoach(), addUser(), deleteUser(), handleDataReset(), handleLogin(), handleSignUp(), handleUpdateCurrentUser(), updateUserInfo()

### Community 4 - "Auth Routes & DB Tables"
Cohesion: 0.07
Nodes (36): doel_users DB Table, Auth Route Dispatcher, Login Handler, Register Handler, doel_counters DB Table, Counter Create Handler, Counter Delete Handler, Counter List Handler (+28 more)

### Community 5 - "Coach & Counter CRUD"
Cohesion: 0.12
Nodes (18): doel_coaches DB Table, Coach Create Handler, Coach Delete Handler, Coach Get Handler, Coach List Handler, Coach Update Handler, doel_ticket_sales DB Table, Sales Record Create Handler (+10 more)

### Community 8 - "Dual Backend (Dev/Prod Sync)"
Cohesion: 0.29
Nodes (12): apiSync Helper, fetchData (useEffect), API /api/coaches Routes, API /api/counters Routes, Excel Export (ExcelJS), API /api/finance Routes, API /api/inventory Routes, API /api/sales Routes (+4 more)

### Community 10 - "Finance Component Logic"
Cohesion: 0.32
Nodes (3): closeModal(), fetchReport(), handleSubmit()

## Knowledge Gaps
- **60 isolated node(s):** `NAV_ITEMS`, `MODULE_LABELS`, `MOCK_COACHES`, `MOCK_TRIPS`, `MOCK_INVENTORY` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Deployment Checklist` connect `PHP Infrastructure (DB/Response/Utils)` to `Auth Routes & DB Tables`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `MySQL Database (u433063181_doel_bus)` connect `PHP Infrastructure (DB/Response/Utils)` to `Auth Routes & DB Tables`, `Coach & Counter CRUD`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `Response` (e.g. with `handleAuth()` and `handleLogin()`) actually correct?**
  _`Response` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `Utils` (e.g. with `handleAuth()` and `handleRegister()`) actually correct?**
  _`Utils` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NAV_ITEMS`, `MODULE_LABELS`, `MOCK_COACHES` to the rest of the system?**
  _60 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PHP Auth & RBAC` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Core App State & API Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._