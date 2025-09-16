import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';

/**
 * Main application component that serves as the root of the simple-todo application.
 *
 * This component implements the mandatory signals-based architecture with zoneless change detection
 * and OnPush change detection strategy for optimal performance.
 *
 * @component
 * @standalone
 * @example
 * ```html
 * <app-root></app-root>
 * ```
 */
@Component({
  imports: [NxWelcome, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /**
   * Application title signal that holds the name of the application.
   * Uses Angular signals for reactive state management per coding standards.
   */
  protected readonly title = signal('simple-todo');
}
