# API Specification

Based on the chosen REST + WebSocket API style from the tech stack, I'll provide a comprehensive OpenAPI 3.0 specification that covers all endpoints from the PRD epics and supports both standard CRUD operations and real-time analytics features.

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: BMad Demonstration To-Do App API
  version: 1.0.0
  description: |
    RESTful API for the BMad methodology demonstration application featuring
    task management, behavioral analytics, and collaborative decision tracking.

    Supports real-time updates via WebSocket connections for analytics dashboard
    and collaborative planning features.

servers:
  - url: https://api.bmad-todo-demo.vercel.app
    description: Production API server
  - url: https://api-staging.bmad-todo-demo.vercel.app
    description: Staging API server
  - url: http://localhost:3000
    description: Local development server

paths:
  # Authentication Endpoints
  /auth/login:
    post:
      summary: User authentication
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
              required: [email, password]
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  accessToken:
                    type: string
                  refreshToken:
                    type: string
        '401':
          $ref: '#/components/responses/Unauthorized'

  /auth/register:
    post:
      summary: User registration
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                name:
                  type: string
                role:
                  $ref: '#/components/schemas/UserRole'
              required: [email, password, name, role]
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  # Task Management Endpoints
  /tasks:
    get:
      summary: List user tasks with filtering
      tags: [Tasks]
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/TaskStatus'
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: List of tasks
          content:
            application/json:
              schema:
                type: object
                properties:
                  tasks:
                    type: array
                    items:
                      $ref: '#/components/schemas/Task'
                  total:
                    type: integer
                  limit:
                    type: integer
                  offset:
                    type: integer

    post:
      summary: Create new task
      tags: [Tasks]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                  maxLength: 200
                description:
                  type: string
                  maxLength: 1000
                estimatedMinutes:
                  type: integer
                  minimum: 1
                priority:
                  $ref: '#/components/schemas/TaskPriority'
                tags:
                  type: array
                  items:
                    type: string
              required: [title]
      responses:
        '201':
          description: Task created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'

  /tasks/{taskId}:
    get:
      summary: Get task details
      tags: [Tasks]
      security:
        - bearerAuth: []
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Task details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'

    put:
      summary: Update task
      tags: [Tasks]
      security:
        - bearerAuth: []
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                description:
                  type: string
                estimatedMinutes:
                  type: integer
                priority:
                  $ref: '#/components/schemas/TaskPriority'
                tags:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Task updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'

    delete:
      summary: Delete task
      tags: [Tasks]
      security:
        - bearerAuth: []
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Task deleted successfully

  /tasks/{taskId}/status:
    post:
      summary: Change task status (triggers analytics capture)
      tags: [Tasks]
      security:
        - bearerAuth: []
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  $ref: '#/components/schemas/TaskStatus'
                notes:
                  type: string
                context:
                  type: object
                  properties:
                    deviceType:
                      type: string
                      enum: [desktop, tablet, mobile]
                    timeOfDay:
                      type: string
                      enum: [morning, afternoon, evening]
              required: [status]
      responses:
        '200':
          description: Status updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  task:
                    $ref: '#/components/schemas/Task'
                  statusChange:
                    $ref: '#/components/schemas/StatusChange'

  # Analytics Endpoints
  /analytics/dashboard:
    get:
      summary: Get dashboard analytics summary
      tags: [Analytics]
      security:
        - bearerAuth: []
      parameters:
        - name: dateRange
          in: query
          schema:
            type: integer
            default: 30
            description: Number of days to include
      responses:
        '200':
          description: Dashboard analytics data
          content:
            application/json:
              schema:
                type: object
                properties:
                  taskStats:
                    type: object
                    properties:
                      total:
                        type: integer
                      completed:
                        type: integer
                      inProgress:
                        type: integer
                      stuck:
                        type: integer
                  entryFrequency:
                    type: array
                    items:
                      type: object
                      properties:
                        date:
                          type: string
                          format: date
                        count:
                          type: integer
                  completionTimes:
                    type: object
                    properties:
                      average:
                        type: number
                      median:
                        type: number
                      distribution:
                        type: array
                        items:
                          type: object
                          properties:
                            range:
                              type: string
                            count:
                              type: integer

  /analytics/behavioral-patterns:
    get:
      summary: Get behavioral pattern analysis
      tags: [Analytics]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Behavioral pattern insights
          content:
            application/json:
              schema:
                type: object
                properties:
                  peakTimes:
                    type: array
                    items:
                      type: object
                      properties:
                        hour:
                          type: integer
                        activity:
                          type: number
                  stuckPatterns:
                    type: array
                    items:
                      type: object
                      properties:
                        pattern:
                          type: string
                        frequency:
                          type: integer
                  productivityTrends:
                    type: array
                    items:
                      type: object
                      properties:
                        period:
                          type: string
                        efficiency:
                          type: number

  # Decision Log Endpoints
  /decisions:
    get:
      summary: List collaborative decisions
      tags: [Decisions]
      security:
        - bearerAuth: []
      parameters:
        - name: category
          in: query
          schema:
            $ref: '#/components/schemas/DecisionCategory'
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/DecisionStatus'
      responses:
        '200':
          description: List of decisions
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Decision'

    post:
      summary: Create new decision
      tags: [Decisions]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                description:
                  type: string
                category:
                  $ref: '#/components/schemas/DecisionCategory'
                impact:
                  type: string
                alternatives:
                  type: string
                tags:
                  type: array
                  items:
                    type: string
              required: [title, description, category]
      responses:
        '201':
          description: Decision created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Decision'

  /decisions/{decisionId}/input:
    post:
      summary: Add stakeholder input to decision
      tags: [Decisions]
      security:
        - bearerAuth: []
      parameters:
        - name: decisionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                inputType:
                  $ref: '#/components/schemas/InputType'
                content:
                  type: string
                agreementLevel:
                  type: integer
                  minimum: 1
                  maximum: 5
                expertise:
                  type: array
                  items:
                    $ref: '#/components/schemas/ExpertiseArea'
              required: [inputType, content, agreementLevel]
      responses:
        '201':
          description: Input added successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DecisionInput'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          $ref: '#/components/schemas/UserRole'
        createdAt:
          type: string
          format: date-time
        lastLoginAt:
          type: string
          format: date-time

    UserRole:
      type: string
      enum: [developer, qa, leadership, business, pm]

    Task:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        status:
          $ref: '#/components/schemas/TaskStatus'
        userId:
          type: string
          format: uuid
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        completedAt:
          type: string
          format: date-time
          nullable: true
        estimatedMinutes:
          type: integer
          nullable: true
        actualMinutes:
          type: integer
          nullable: true
        priority:
          $ref: '#/components/schemas/TaskPriority'
        tags:
          type: array
          items:
            type: string

    TaskStatus:
      type: string
      enum: [not_started, in_progress, stuck, completed]

    TaskPriority:
      type: string
      enum: [low, medium, high, urgent]

    StatusChange:
      type: object
      properties:
        id:
          type: string
          format: uuid
        taskId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        fromStatus:
          $ref: '#/components/schemas/TaskStatus'
          nullable: true
        toStatus:
          $ref: '#/components/schemas/TaskStatus'
        changedAt:
          type: string
          format: date-time
        durationMs:
          type: integer
          nullable: true
        notes:
          type: string
          nullable: true

    Decision:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        category:
          $ref: '#/components/schemas/DecisionCategory'
        status:
          $ref: '#/components/schemas/DecisionStatus'
        proposedBy:
          type: string
          format: uuid
        approvedBy:
          type: string
          format: uuid
          nullable: true
        createdAt:
          type: string
          format: date-time
        approvedAt:
          type: string
          format: date-time
          nullable: true
        impact:
          type: string
        alternatives:
          type: string
          nullable: true
        tags:
          type: array
          items:
            type: string

    DecisionCategory:
      type: string
      enum: [architecture, technology, process, ux_design, methodology]

    DecisionStatus:
      type: string
      enum: [proposed, under_discussion, approved, implemented, revisited]

    DecisionInput:
      type: object
      properties:
        id:
          type: string
          format: uuid
        decisionId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        inputType:
          $ref: '#/components/schemas/InputType'
        content:
          type: string
        createdAt:
          type: string
          format: date-time
        agreementLevel:
          type: integer
          minimum: 1
          maximum: 5
        expertise:
          type: array
          items:
            $ref: '#/components/schemas/ExpertiseArea'

    InputType:
      type: string
      enum: [suggestion, concern, approval, question, alternative]

    ExpertiseArea:
      type: string
      enum: [frontend, backend, database, testing, security, performance, ux]

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                    example: "UNAUTHORIZED"
                  message:
                    type: string
                    example: "Authentication required"
                  timestamp:
                    type: string
                    format: date-time
                  requestId:
                    type: string
                    format: uuid
```
