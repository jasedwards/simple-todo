# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing both frontend and backend modules with shared TypeScript interfaces for API contracts. This approach simplifies development workflow for the small team and supports the collaborative planning methodology by keeping all code and decisions in one transparent location.

## Service Architecture

**Monolith with modular service layer** - RESTful API design with clear separation of concerns, designed for future extensibility to support Phase 2 ML features. This balances MVP development speed with architectural flexibility for planned advanced analytics capabilities.

## Testing Requirements

**Unit + Integration testing** with focus on critical user workflows and API endpoints. Given the 2-3 week timeline and methodology demonstration objectives, comprehensive testing provides confidence for stakeholder presentations while avoiding over-engineering.

## Additional Technical Assumptions and Requests

**Frontend Technology Stack:**

- **Angular (latest stable)** with TypeScript for type safety and maintainable code architecture
- **Angular Material** or similar component library for professional UI consistency
- **Chart.js or D3.js** for analytics data visualization capabilities
- **RxJS** for reactive programming patterns supporting real-time analytics updates
  **Backend Technology Stack:**
- **Node.js with Express** framework for API development, leveraging JavaScript full-stack consistency
- **TypeScript** throughout backend for type safety and team collaboration
- **JWT-based authentication** for secure session management
- **Structured logging framework** (Winston or similar) for audit trail requirements
  **Database and Data Management:**
- **PostgreSQL** for reliable relational data management with JSON columns for analytics flexibility
- **Database migration system** (Knex.js or TypeORM) for version control and team collaboration
- **Connection pooling** for performance optimization under analytics load
  **Infrastructure and Deployment:**
- **Cloud-based hosting** (AWS, Azure, or Google Cloud) with CI/CD pipeline
- **Docker containerization** for consistent deployment across environments
- **GitHub Actions or similar** for automated testing and deployment pipeline
- **Environment configuration management** for secure credential handling
  **Development Workflow Assumptions:**
- **Git-based collaboration** with transparent commit messages supporting methodology documentation
- **Code review process** involving all technical stakeholders as part of collaborative approach
- **Shared development environment setup** to ensure consistent team experience
- **Documentation-driven development** where technical decisions are captured in decision log
