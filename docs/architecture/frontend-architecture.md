# Frontend Architecture

Defining the Angular-specific architecture details that support both sophisticated task management functionality and professional stakeholder demonstration requirements. The frontend architecture emphasizes real-time analytics capabilities and collaborative planning visualization.

### Angular Coding Standards

**MANDATORY**: All Angular development must follow signals-based architecture with zoneless operation and comprehensive JSDoc documentation.

#### Signals-Based Architecture Requirements

**Core Principles:**
- All state management uses Angular Signals
- Zoneless change detection with `provideExperimentalZonelessChangeDetection()`
- OnPush change detection strategy for all components
- Comprehensive JSDoc documentation for all public APIs
- Modern Angular patterns with standalone components

#### Bootstrap Configuration for Zoneless Mode

```typescript
/**
 * Application bootstrap with zoneless configuration
 * @file main.ts
 * @description Optimized Angular bootstrap for signals-based architecture
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    // CRITICAL: Enable zoneless change detection
    provideExperimentalZonelessChangeDetection(),

    // Optimized providers for performance
    provideRouter(routes),
    provideHttpClient(withFetch()),

    // Application-specific providers
    // ...
  ]
}).catch(err => console.error(err));
```

#### Component Pattern Template

```typescript
/**
 * Standard component template following signals-based architecture
 * @component ExampleComponent
 * @description Template demonstrating required patterns and documentation
 * @signals
 * - `data`: Component data state
 * - `loading`: Loading state indicator
 * - `error`: Error message state
 * @example
 * ```html
 * <app-example
 *   [initialData]="data()"
 *   (dataChange)="onDataChange($event)">
 * </app-example>
 * ```
 */
@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="component-container">
      @if (loading()) {
        <div class="loading-state">Loading...</div>
      } @else if (error(); as errorMsg) {
        <div class="error-state">{{ errorMsg }}</div>
      } @else {
        <div class="content">
          <!-- Component content with signals -->
          <h2>{{ computedTitle() }}</h2>
          <p>Data count: {{ data().length }}</p>
        </div>
      }
    </div>
  `
})
export class ExampleComponent implements OnInit {
  /**
   * Input signal for initial data
   * @input
   * @signal
   */
  initialData = input<DataItem[]>([]);

  /**
   * Output for data changes
   * @output
   */
  dataChange = output<DataItem[]>();

  /**
   * Internal data signal
   * @signal
   */
  data = signal<DataItem[]>([]);

  /**
   * Loading state signal
   * @signal
   */
  loading = signal<boolean>(false);

  /**
   * Error state signal
   * @signal
   */
  error = signal<string | null>(null);

  /**
   * Computed title signal
   * @computed
   */
  computedTitle = computed(() => {
    const items = this.data();
    return `Data Overview (${items.length} items)`;
  });

  ngOnInit(): void {
    // Initialize with input data
    effect(() => {
      const initial = this.initialData();
      this.data.set(initial);
    });
  }
}
```

#### Service Pattern Template

```typescript
/**
 * Standard service template with signals-based state management
 * @service ExampleService
 * @description Demonstrates signals-based service patterns
 */
@Injectable({
  providedIn: 'root'
})
export class ExampleService {
  /**
   * Private state signals
   * @private
   * @signal
   */
  private readonly _items = signal<Item[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  /**
   * Public readonly signals
   * @readonly
   * @signal
   */
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Computed signals for derived state
   * @computed
   */
  readonly itemCount = computed(() => this._items().length);
  readonly hasItems = computed(() => this._items().length > 0);

  private readonly http = inject(HttpClient);

  /**
   * Loads items with signals-based state management
   * @method loadItems
   * @async
   */
  async loadItems(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const items = await firstValueFrom(
        this.http.get<Item[]>('/api/items')
      );
      this._items.set(items);
    } catch (error) {
      this._error.set('Failed to load items');
    } finally {
      this._loading.set(false);
    }
  }
}
```

#### JSDoc Documentation Standards

**Required JSDoc tags for components:**
- `@component` - Component name
- `@description` - Detailed component description
- `@signals` - List of component signals
- `@example` - Usage example with HTML
- `@since` - Version introduced

**Required JSDoc tags for services:**
- `@service` - Service name
- `@injectable` - Injectable annotation
- `@description` - Service purpose and functionality
- `@since` - Version introduced

**Required JSDoc tags for signals:**
- `@signal` - Mark as signal
- `@readonly` - For readonly signals
- `@computed` - For computed signals
- `@input` - For input signals
- `@output` - For output signals
- `@private` - For private signals
- `@description` - Signal purpose
- `@type` - TypeScript type
- `@returns` - Return type for computed signals

#### Comprehensive Standards Reference

For complete coding standards, advanced patterns, and detailed examples, see:

📋 **[Angular Coding Standards](./architecture/coding-standards.md)**

This document contains:
- Advanced signals patterns and state management
- Comprehensive component and service examples
- Performance optimization techniques
- Testing strategies for signals-based code
- Accessibility and error handling standards
- Pre-commit checklists and code review guidelines

**All team members must follow these standards for consistent, maintainable, and performant Angular code.**

### Component Architecture

#### Component Organization

```text
src/
├── app/
│   ├── core/                           # Singleton services and guards
│   │   ├── auth/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── shared/                         # Reusable components and utilities
│   │   ├── components/
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── models/
│   ├── features/                       # Feature modules
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── dashboard.module.ts
│   │   ├── tasks/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── tasks.module.ts
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── analytics.module.ts
│   │   ├── decisions/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── decisions.module.ts
│   │   └── methodology/
│   │       ├── components/
│   │       ├── services/
│   │       └── methodology.module.ts
│   ├── layout/                         # Shell components
│   │   ├── header/
│   │   ├── sidebar/
│   │   └── footer/
│   └── store/                          # NgRx state management
│       ├── actions/
│       ├── effects/
│       ├── reducers/
│       └── selectors/
```

#### Component Template

```typescript
// Feature component following Angular best practices
@Component({
  selector: 'app-analytics-dashboard',
  template: `
    <div class="analytics-dashboard" [class.demo-mode]="isDemoMode">
      <mat-card class="dashboard-header">
        <mat-card-header>
          <mat-card-title>
            Productivity Analytics
            <mat-chip-set *ngIf="isDemoMode">
              <mat-chip color="primary">Live Demo</mat-chip>
            </mat-chip-set>
          </mat-card-title>
          <mat-card-subtitle>
            Real-time insights showcasing technical sophistication
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <div class="metrics-grid">
        <app-metric-card
          *ngFor="let metric of metrics$ | async"
          [metric]="metric"
          [realTimeEnabled]="realTimeEnabled"
          (onDrillDown)="handleDrillDown($event)">
        </app-metric-card>
      </div>

      <div class="charts-section">
        <app-analytics-chart
          [chartData]="chartData$ | async"
          [chartType]="selectedChartType"
          [isDemoMode]="isDemoMode"
          (onDataPointClick)="handleChartInteraction($event)">
        </app-analytics-chart>
      </div>

      <app-methodology-panel
        [collaborationMetrics]="collaboration$ | async"
        [stakeholderContributions]="contributions$ | async">
      </app-methodology-panel>
    </div>
  `,
  styleUrls: ['./analytics-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  // Observable streams for reactive programming
  metrics$ = this.store.select(selectDashboardMetrics);
  chartData$ = this.store.select(selectChartData);
  collaboration$ = this.store.select(selectCollaborationMetrics);
  contributions$ = this.store.select(selectStakeholderContributions);

  // Demo mode for stakeholder presentations
  @Input() isDemoMode = false;
  @Input() realTimeEnabled = true;

  // Chart configuration for professional presentations
  selectedChartType: ChartType = 'line';

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private analyticsService: AnalyticsService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    // Initialize real-time data subscriptions
    this.setupRealTimeSubscriptions();

    // Load initial dashboard data
    this.store.dispatch(AnalyticsActions.loadDashboardData());
  }

  private setupRealTimeSubscriptions(): void {
    if (this.realTimeEnabled) {
      this.webSocketService.onAnalyticsUpdate()
        .pipe(takeUntil(this.destroy$))
        .subscribe(update => {
          this.store.dispatch(AnalyticsActions.updateRealTimeMetrics({ update }));
        });
    }
  }

  handleDrillDown(metric: MetricCard): void {
    // Navigate to detailed analytics view
    this.store.dispatch(AnalyticsActions.drillDownMetric({ metric }));
  }

  handleChartInteraction(dataPoint: ChartDataPoint): void {
    // Show detailed insights for chart interaction
    this.store.dispatch(AnalyticsActions.showDataPointDetails({ dataPoint }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### State Management Architecture

#### State Structure

```typescript
// NgRx state structure supporting real-time analytics and collaboration
export interface AppState {
  auth: AuthState;
  tasks: TasksState;
  analytics: AnalyticsState;
  decisions: DecisionsState;
  methodology: MethodologyState;
  ui: UiState;
}

export interface AnalyticsState {
  dashboard: {
    metrics: DashboardMetrics | null;
    chartData: ChartData | null;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
  };
  behavioralPatterns: {
    patterns: BehavioralPattern[];
    insights: AnalyticsInsight[];
    loading: boolean;
  };
  realTime: {
    isConnected: boolean;
    updates: RealTimeUpdate[];
    subscriptions: string[];
  };
}

export interface DecisionsState {
  decisions: Decision[];
  currentDecision: Decision | null;
  stakeholderInputs: DecisionInput[];
  collaborationMetrics: CollaborationMetrics | null;
  filters: {
    category: DecisionCategory | null;
    status: DecisionStatus | null;
    dateRange: DateRange | null;
  };
  loading: boolean;
  error: string | null;
}
```

#### State Management Patterns

- **Feature State Isolation**: Each major feature (tasks, analytics, decisions) manages its own state slice
- **Real-time State Updates**: WebSocket integration updates state automatically for live demonstrations
- **Optimistic Updates**: UI updates immediately for responsive user experience during stakeholder presentations
- **Error State Management**: Comprehensive error handling ensures reliable demonstrations
- **Caching Strategy**: Intelligent caching reduces API calls and improves performance during presentations

### Routing Architecture

#### Route Organization

```text
/                                       # Dashboard (default route)
├── /auth/
│   ├── /login                         # Authentication entry point
│   └── /register                      # User registration
├── /dashboard                         # Main analytics dashboard
├── /tasks/
│   ├── /list                          # Task management interface
│   ├── /create                        # Task creation form
│   └── /:id/edit                      # Task editing
├── /analytics/
│   ├── /overview                      # Analytics summary
│   ├── /behavioral-patterns           # Advanced pattern analysis
│   ├── /completion-trends             # Time analysis
│   └── /productivity-insights         # Productivity metrics
├── /decisions/
│   ├── /log                           # Decision log view
│   ├── /create                        # New decision creation
│   ├── /:id/details                   # Decision details with inputs
│   └── /collaboration-metrics         # Stakeholder attribution
├── /methodology/
│   ├── /overview                      # BMad methodology documentation
│   ├── /success-metrics               # Methodology effectiveness
│   └── /artifacts                     # Planning artifacts
└── /demo/                             # Special demo routes for presentations
    ├── /stakeholder-presentation      # Curated stakeholder demo flow
    └── /technical-showcase            # Technical capabilities demo
```

#### Protected Route Pattern

```typescript
// Route guard ensuring authenticated access and role-based permissions
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store<AppState>
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        // Check role-based permissions for methodology features
        const requiredRole = route.data['role'] as UserRole;
        if (requiredRole) {
          return this.authService.hasRole(requiredRole);
        }

        return true;
      })
    );
  }
}

// Demo guard for presentation mode
@Injectable({
  providedIn: 'root'
})
export class DemoModeGuard implements CanActivate {
  canActivate(): boolean {
    // Enable special demo features and sample data
    return environment.demoModeEnabled;
  }
}
```

### Frontend Services Layer

#### API Client Setup

```typescript
// Centralized API client with interceptors and error handling
@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Generic HTTP methods with error handling
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // Comprehensive error handling for reliable demonstrations
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
    }

    // Log error for debugging during development
    console.error('API Error:', error);

    // Show user-friendly error message
    return throwError(() => new Error(errorMessage));
  }
}
```

#### Service Example

```typescript
// Analytics service showcasing advanced capabilities
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(
    private apiClient: ApiClientService,
    private webSocketService: WebSocketService
  ) {}

  // Dashboard metrics with caching for performance
  getDashboardMetrics(dateRange: number = 30): Observable<DashboardMetrics> {
    const params = new HttpParams().set('dateRange', dateRange.toString());

    return this.apiClient.get<DashboardMetrics>('/analytics/dashboard', params)
      .pipe(
        // Cache results for 5 minutes to improve presentation performance
        shareReplay({ bufferSize: 1, refCount: true })
      );
  }

  // Real-time analytics updates for live demonstrations
  getRealtimeUpdates(): Observable<AnalyticsUpdate> {
    return this.webSocketService.subscribe<AnalyticsUpdate>('analytics_updates')
      .pipe(
        filter(update => update.type === 'analytics'),
        map(update => update.payload)
      );
  }

  // Behavioral pattern analysis showcasing ML capabilities
  getBehavioralPatterns(): Observable<BehavioralPattern[]> {
    return this.apiClient.get<BehavioralPattern[]>('/analytics/behavioral-patterns')
      .pipe(
        map(patterns => patterns.sort((a, b) => b.confidence - a.confidence))
      );
  }

  // Export functionality for stakeholder reporting
  exportAnalytics(format: 'csv' | 'json' | 'pdf'): Observable<Blob> {
    const params = new HttpParams().set('format', format);

    return this.apiClient.get<Blob>('/analytics/export', params)
      .pipe(
        map(blob => new Blob([blob], {
          type: this.getContentType(format)
        }))
      );
  }

  private getContentType(format: string): string {
    const types = {
      csv: 'text/csv',
      json: 'application/json',
      pdf: 'application/pdf'
    };
    return types[format] || 'application/octet-stream';
  }
}
```
