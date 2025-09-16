# Data Models

Based on the PRD requirements and epics, I'll define the core data models that will be shared between frontend and backend to support the BMad methodology demonstration and advanced analytics features.

### User

**Purpose:** Represents system users participating in the BMad methodology demonstration, supporting role-based collaboration tracking and stakeholder attribution features.

**Key Attributes:**
- id: string (UUID) - Unique user identifier
- email: string - Authentication and communication
- name: string - Display name for stakeholder attribution
- role: UserRole - Collaboration role (Developer, QA, Leadership, Business)
- createdAt: DateTime - Account creation timestamp
- lastLoginAt: DateTime - Activity tracking for engagement metrics
- preferences: UserPreferences - Personalization settings for analytics dashboard

#### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date | null;
  preferences: UserPreferences;
}

enum UserRole {
  DEVELOPER = 'developer',
  QA = 'qa',
  LEADERSHIP = 'leadership',
  BUSINESS = 'business',
  PM = 'pm'
}

interface UserPreferences {
  dashboardLayout: 'analytics' | 'tasks' | 'methodology';
  notificationSettings: NotificationSettings;
  analyticsDateRange: number; // days
}
```

#### Relationships
- One-to-many with Task (user creates tasks)
- One-to-many with StatusChange (user changes task status)
- One-to-many with DecisionInput (user contributes to decisions)

### Task

**Purpose:** Core task entity supporting enhanced status tracking, behavioral analytics capture, and productivity measurement for the BMad methodology demonstration.

**Key Attributes:**
- id: string (UUID) - Unique task identifier
- title: string - Task description
- description: string - Detailed task information
- status: TaskStatus - Current task state
- userId: string - Task owner reference
- createdAt: DateTime - Analytics timestamp for entry frequency tracking
- updatedAt: DateTime - Last modification timestamp
- completedAt: DateTime - Completion timestamp for analytics
- estimatedMinutes: number - User estimate for completion time analysis
- actualMinutes: number - Calculated from status changes

#### TypeScript Interface
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  tags: string[];
  priority: TaskPriority;
}

enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  STUCK = 'stuck',
  COMPLETED = 'completed'
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

#### Relationships
- Many-to-one with User (tasks belong to users)
- One-to-many with StatusChange (task status history)
- Many-to-many with Decision (tasks can reference collaborative decisions)

### StatusChange

**Purpose:** Tracks all task status transitions for completion time analytics, behavioral pattern recognition, and productivity measurement supporting the advanced analytics features.

**Key Attributes:**
- id: string (UUID) - Unique change identifier
- taskId: string - Associated task reference
- userId: string - User who made the change
- fromStatus: TaskStatus - Previous status state
- toStatus: TaskStatus - New status state
- changedAt: DateTime - Precise timestamp for analytics
- durationMs: number - Calculated time in previous status
- notes: string - Optional user notes about status change

#### TypeScript Interface
```typescript
interface StatusChange {
  id: string;
  taskId: string;
  userId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  changedAt: Date;
  durationMs: number | null;
  notes: string | null;
  context: ChangeContext;
}

interface ChangeContext {
  sessionId: string; // For behavioral analytics
  deviceType: 'desktop' | 'tablet' | 'mobile';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}
```

#### Relationships
- Many-to-one with Task (status changes belong to tasks)
- Many-to-one with User (user makes status changes)

### Decision

**Purpose:** Captures collaborative planning decisions with stakeholder attribution, supporting the BMad methodology demonstration and transparency requirements.

**Key Attributes:**
- id: string (UUID) - Unique decision identifier
- title: string - Decision summary
- description: string - Detailed decision context and rationale
- category: DecisionCategory - Type of decision made
- status: DecisionStatus - Current decision state
- proposedBy: string - User who proposed the decision
- approvedBy: string - User who approved the decision
- createdAt: DateTime - Decision creation timestamp
- approvedAt: DateTime - Decision approval timestamp
- impact: string - Expected impact of the decision
- alternatives: string - Alternative options considered

#### TypeScript Interface
```typescript
interface Decision {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  status: DecisionStatus;
  proposedBy: string;
  approvedBy: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  impact: string;
  alternatives: string | null;
  tags: string[];
}

enum DecisionCategory {
  ARCHITECTURE = 'architecture',
  TECHNOLOGY = 'technology',
  PROCESS = 'process',
  UX_DESIGN = 'ux_design',
  METHODOLOGY = 'methodology'
}

enum DecisionStatus {
  PROPOSED = 'proposed',
  UNDER_DISCUSSION = 'under_discussion',
  APPROVED = 'approved',
  IMPLEMENTED = 'implemented',
  REVISITED = 'revisited'
}
```

#### Relationships
- Many-to-one with User (proposedBy, approvedBy)
- One-to-many with DecisionInput (stakeholder contributions)
- Many-to-many with Task (decisions can reference tasks)

### DecisionInput

**Purpose:** Tracks stakeholder contributions to collaborative decisions, enabling attribution and participation measurement for BMad methodology demonstration.

**Key Attributes:**
- id: string (UUID) - Unique input identifier
- decisionId: string - Associated decision reference
- userId: string - Contributing stakeholder
- inputType: InputType - Type of contribution made
- content: string - Stakeholder input content
- createdAt: DateTime - Contribution timestamp
- agreementLevel: number - Stakeholder agreement score (1-5)

#### TypeScript Interface
```typescript
interface DecisionInput {
  id: string;
  decisionId: string;
  userId: string;
  inputType: InputType;
  content: string;
  createdAt: Date;
  agreementLevel: number; // 1-5 scale
  expertise: ExpertiseArea[];
}

enum InputType {
  SUGGESTION = 'suggestion',
  CONCERN = 'concern',
  APPROVAL = 'approval',
  QUESTION = 'question',
  ALTERNATIVE = 'alternative'
}

enum ExpertiseArea {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  TESTING = 'testing',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  UX = 'ux'
}
```

#### Relationships
- Many-to-one with Decision (inputs belong to decisions)
- Many-to-one with User (user provides input)
