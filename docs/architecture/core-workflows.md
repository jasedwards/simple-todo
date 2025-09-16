# Core Workflows

I'll illustrate the key system workflows using sequence diagrams that show both the technical architecture in action and the BMad methodology demonstration value. These workflows represent critical user journeys from the PRD that showcase collaborative planning benefits.

### Task Creation with Analytics Capture Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend App
    participant API as Task API Service
    participant Analytics as Analytics Service
    participant DB as PostgreSQL
    participant WS as WebSocket Service
    participant Dashboard as Dashboard Users

    U->>FE: Create new task
    FE->>FE: Validate form data
    FE->>API: POST /tasks
    API->>DB: Insert task record
    API->>Analytics: Emit task creation event
    Analytics->>DB: Update entry frequency metrics
    Analytics->>WS: Broadcast analytics update
    WS->>Dashboard: Real-time metrics update
    API->>FE: Return task object
    FE->>U: Show success + updated task list

    Note over Analytics,DB: Background processing for<br/>behavioral pattern analysis
    Analytics->>DB: Async pattern computation
```

### Enhanced Status Change with Real-time Analytics

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend App
    participant API as Task API Service
    participant Analytics as Analytics Service
    participant DB as PostgreSQL
    participant WS as WebSocket Service
    participant Team as Team Members

    U->>FE: Change task status to "Stuck"
    FE->>API: POST /tasks/{id}/status
    API->>DB: Begin transaction
    API->>DB: Update task status
    API->>DB: Insert status_change record
    API->>Analytics: Calculate duration & patterns
    Analytics->>DB: Update completion analytics
    API->>DB: Commit transaction

    alt Status is "Stuck" > 48hrs
        Analytics->>Analytics: Generate intervention suggestions
        Analytics->>WS: Broadcast stuck task alert
        WS->>Team: Notify team members
    end

    API->>WS: Broadcast status change
    WS->>FE: Real-time status update
    API->>FE: Return updated task + analytics
    FE->>U: Show status change + productivity insights
```

### Collaborative Decision Creation Workflow

```mermaid
sequenceDiagram
    participant PM as Project Manager
    participant Dev as Developer
    participant QA as QA Engineer
    participant Lead as Technical Lead
    participant FE as Frontend App
    participant API as Decision API Service
    participant DB as PostgreSQL
    participant Notify as Notification Service
    participant WS as WebSocket Service

    PM->>FE: Create new technical decision
    FE->>API: POST /decisions
    API->>DB: Insert decision record
    API->>Notify: Send stakeholder notifications

    Notify->>Dev: Email: Input needed on decision
    Notify->>QA: Email: Input needed on decision
    Notify->>Lead: Email: Input needed on decision

    Dev->>FE: Add technical input
    FE->>API: POST /decisions/{id}/input
    API->>DB: Insert decision_input record
    API->>WS: Broadcast new input
    WS->>PM: Real-time notification

    QA->>FE: Add quality concerns
    FE->>API: POST /decisions/{id}/input
    API->>DB: Insert decision_input record

    Lead->>FE: Review inputs & approve
    FE->>API: PUT /decisions/{id} (status: approved)
    API->>DB: Update decision status
    API->>WS: Broadcast decision approval
    WS->>Dev: Decision finalized notification
    WS->>QA: Decision finalized notification

    Note over PM,WS: BMad methodology demonstration:<br/>All stakeholders contributed input<br/>before implementation begins
```

### Real-time Analytics Dashboard Update Workflow

```mermaid
sequenceDiagram
    participant Users as Multiple Users
    participant Tasks as Task API Service
    participant Analytics as Analytics Service
    participant Cache as Redis Cache
    participant DB as PostgreSQL
    participant WS as WebSocket Service
    participant Dashboard as Dashboard View

    Users->>Tasks: Various task operations
    Tasks->>Analytics: Emit analytics events

    loop Background Processing
        Analytics->>DB: Query raw task data
        Analytics->>Analytics: Compute behavioral patterns
        Analytics->>Cache: Store computed metrics
    end

    Dashboard->>Analytics: GET /analytics/dashboard
    Analytics->>Cache: Retrieve cached metrics
    Cache->>Analytics: Return dashboard data
    Analytics->>Dashboard: Dashboard analytics payload

    Note over Analytics,WS: Real-time updates for<br/>stakeholder demonstrations

    alt New pattern detected
        Analytics->>WS: Broadcast pattern insight
        WS->>Dashboard: Real-time chart update
        Dashboard->>Dashboard: Animate new data visualization
    end

    Note over Dashboard: Professional presentation quality<br/>for stakeholder demonstrations
```

### End-to-End BMad Methodology Demonstration Workflow

```mermaid
sequenceDiagram
    participant Stakeholder as Business Stakeholder
    participant Lead as Technical Lead
    participant Team as Development Team
    participant App as BMad Demo App
    participant Analytics as Analytics Engine
    participant Decisions as Decision Log

    Stakeholder->>Lead: Request methodology demonstration
    Lead->>App: Login to demonstration environment
    App->>Analytics: Load dashboard with sample data

    Lead->>Stakeholder: Show analytics sophistication
    App->>App: Display real-time charts & patterns

    Lead->>Decisions: Navigate to decision log
    Decisions->>Decisions: Show stakeholder attributions

    Note over Lead,Stakeholder: Methodology value demonstration:<br/>"See how all team members<br/>contributed to technical decisions"

    Lead->>App: Create live decision during demo
    App->>Team: Send notification for input
    Team->>App: Provide real-time input
    App->>Stakeholder: Show collaborative process

    Stakeholder->>Lead: Question about problem prevention
    Lead->>Decisions: Show prevented issues examples
    Decisions->>Stakeholder: Display methodology metrics

    Note over Stakeholder,Decisions: Business value demonstration:<br/>Reduced late-cycle changes<br/>Increased team engagement
```
