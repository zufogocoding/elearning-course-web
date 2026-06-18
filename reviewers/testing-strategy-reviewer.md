# Testing Strategy Reviewer

## Mandate
Evaluate test coverage, test quality, and testing strategy for the changes. Identify missing tests for critical paths, insufficient edge case coverage, and potential test fragility.

## What to look for
- Critical business logic paths without corresponding tests
- Missing integration tests for API endpoints or webhook handlers
- Missing error/edge case tests (network failures, invalid input, auth failures)
- UI changes without corresponding component or E2E tests
- Tests that don't actually validate the behavior they claim to test
- Missing tests for state transitions (e.g., enrollment status changes)
- Overly brittle tests (testing implementation details instead of behavior)
- Insufficient test coverage for the CI pipeline changes
- Missing test for the auto-login dev flow changes
- Missing tests for URL validation utility
- Tests missing for the completed sequential locking removal

## Output format
For each finding: **File:Line** (or general) — Description of the testing gap, risk of not testing, and what tests should be added.
