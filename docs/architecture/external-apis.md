# External APIs

Based on the PRD requirements and component design, I've analyzed the external API integrations needed. The BMad demonstration application requires minimal external dependencies to maintain focus on methodology demonstration and technical showcase objectives.

### GitHub API

- **Purpose:** Repository integration for transparent development methodology demonstration and commit/PR activity tracking in decision logs
- **Documentation:** https://docs.github.com/en/rest
- **Base URL(s):** https://api.github.com
- **Authentication:** Personal Access Token (PAT) or GitHub App authentication
- **Rate Limits:** 5,000 requests per hour (authenticated), 60 requests per hour (unauthenticated)

**Key Endpoints Used:**
- `GET /repos/{owner}/{repo}/commits` - Display recent development activity in methodology dashboard
- `GET /repos/{owner}/{repo}/pulls` - Show collaborative PR review process as part of BMad demonstration
- `GET /repos/{owner}/{repo}/issues` - Link decision log entries to specific GitHub issues/discussions

**Integration Notes:** Optional integration for enhanced methodology demonstration. Primary use is showing transparent development process and linking decision log entries to actual development artifacts. Rate limiting requires caching and strategic API usage during stakeholder presentations.

### Supabase Real-time API

- **Purpose:** WebSocket-based real-time database subscriptions for live analytics updates and collaborative decision notifications
- **Documentation:** https://supabase.com/docs/guides/realtime
- **Base URL(s):** wss://{project-id}.supabase.co/realtime/v1/websocket
- **Authentication:** JWT token-based authentication integrated with Supabase Auth
- **Rate Limits:** Connection-based limits, typically 100 concurrent connections per project

**Key Endpoints Used:**
- `WebSocket /realtime/v1/websocket` - Real-time database change subscriptions
- Database table subscriptions for `tasks`, `status_changes`, `decisions`, `decision_inputs`

**Integration Notes:** Core to the real-time analytics demonstration. Enables live dashboard updates during stakeholder presentations. Essential for showcasing technical sophistication through real-time collaborative features.

### Chart.js/D3.js (Client-side Libraries)

- **Purpose:** Professional data visualization for analytics dashboard showcasing advanced technical capabilities
- **Documentation:** https://www.chartjs.org/docs/, https://d3js.org/
- **Base URL(s):** CDN or npm package integration
- **Authentication:** Not applicable (client-side libraries)
- **Rate Limits:** Not applicable

**Key Endpoints Used:**
- Chart.js: Various chart type configurations for analytics dashboard
- D3.js: Custom behavioral pattern visualizations for advanced analytics showcase

**Integration Notes:** Primary visualization engine for stakeholder demonstrations. Chart.js provides professional, consistent charts while D3.js enables custom visualizations for sophisticated behavioral analytics. Critical for impressing technical and business stakeholders.
