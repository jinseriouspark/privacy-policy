# Yeyak-mania QA Test Suite

Comprehensive testing suite for the 예약매니아 (Yeyak-mania) reservation SaaS platform.

## Overview

This test suite provides complete coverage for:
- **API Tests**: Database operations, CRUD operations, data integrity
- **Scenario Tests**: End-to-end user workflows and business logic
- **UI Tests**: User interface components and interactions

## Test Stack

- **pytest**: Testing framework
- **Supabase Python Client**: Database testing
- **Playwright**: Browser automation and UI testing
- **pytest-html**: HTML test reports
- **pytest-cov**: Code coverage analysis

## Project Structure

```
qa/
├── config.py              # Configuration and test helpers
├── test_api.py           # API and database tests
├── test_scenarios.py     # End-to-end scenario tests
├── test_ui.py            # UI and integration tests
├── requirements.txt      # Python dependencies
├── run_tests.sh         # Test runner script
├── README.md            # This file
├── reports/             # Test reports (auto-generated)
├── coverage/            # Coverage reports (auto-generated)
└── screenshots/         # UI test screenshots (auto-generated)
```

## Setup

### Prerequisites

- Python 3.8 or higher
- Active Supabase project
- Environment variables configured

### Installation

1. **Navigate to the QA directory:**
   ```bash
   cd /Users/jinseulpark/Desktop/github/smart_reservation/qa
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Playwright browsers:**
   ```bash
   playwright install chromium
   ```

5. **Configure environment variables:**

   Ensure your `.env` file in the project root contains:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

## Running Tests

### Quick Start

Run all tests with default settings:
```bash
./run_tests.sh
```

### Run Specific Test Suites

**API tests only:**
```bash
./run_tests.sh --api-only
```

**Scenario tests only:**
```bash
./run_tests.sh --scenarios-only
```

**UI tests only:**
```bash
./run_tests.sh --ui-only
```

### Advanced Options

**Run tests in parallel:**
```bash
./run_tests.sh --parallel
```

**Generate coverage report:**
```bash
./run_tests.sh --coverage
```

**Run UI tests with visible browser (headed mode):**
```bash
./run_tests.sh --ui-only --headed
```

**Verbose output:**
```bash
./run_tests.sh --verbose
```

### Using pytest directly

You can also run tests directly with pytest:

```bash
# Activate virtual environment first
source venv/bin/activate

# Run all tests
pytest -v

# Run specific test file
pytest test_api.py -v

# Run specific test class
pytest test_api.py::TestUserOperations -v

# Run specific test
pytest test_api.py::TestUserOperations::test_create_instructor_user -v

# Run with markers (if configured)
pytest -m "not slow" -v
```

## Test Coverage

### API Tests (`test_api.py`)

**Total Test Cases: ~35**

1. **Database Connectivity (3 tests)**
   - Environment configuration validation
   - Supabase connection
   - Service role authentication

2. **User Operations (5 tests)**
   - Create instructor user
   - Create student user
   - Email uniqueness validation
   - Get user by email
   - Update user profile

3. **Coaching Operations (4 tests)**
   - Create private coaching
   - Create group coaching
   - List active coachings
   - Deactivate coaching

4. **Package Operations (4 tests)**
   - Create package
   - Session deduction
   - Expired package detection
   - Zero sessions handling

5. **Reservation Operations (6 tests)**
   - Create reservation
   - Conflict detection
   - Cancel reservation
   - Get student reservations
   - Google Meet link integration
   - Overlapping time slots

6. **Instructor Settings (2 tests)**
   - Create settings
   - Update business hours

7. **Group Classes (3 tests)**
   - Create group class
   - Capacity checking
   - Increment participant count

### Scenario Tests (`test_scenarios.py`)

**Total Test Cases: ~20**

1. **Instructor Workflows (3 tests)**
   - Complete onboarding flow
   - Student management workflow
   - Schedule management

2. **Student Workflows (3 tests)**
   - Complete booking flow
   - View package information
   - Cancel reservation

3. **Edge Cases (6 tests)**
   - Expired package booking attempt
   - Zero sessions remaining
   - Overlapping reservations
   - Past time slot validation
   - Group class over capacity
   - Multiple active packages

4. **Reservation Flows (2 tests)**
   - Recurring weekly reservations
   - Multiple same-day bookings

### UI Tests (`test_ui.py`)

**Total Test Cases: ~30**

1. **Landing Page (4 tests)**
   - Page loads correctly
   - CTA buttons present
   - Responsive design
   - Navigation

2. **Authentication (3 tests)**
   - Login modal
   - Google OAuth button
   - User type selection

3. **Instructor Dashboard (3 tests)**
   - Dashboard tabs
   - Create coaching modal
   - Package management

4. **Student Booking (5 tests)**
   - View instructor profile
   - Calendar view
   - Time slot selection
   - Reservation viewing
   - Package info display

5. **Reservation Flow (2 tests)**
   - Complete booking flow
   - Cancellation flow

6. **Group Classes (2 tests)**
   - Create group class
   - View participants

7. **Business Hours (2 tests)**
   - Configure hours
   - Set working days

8. **Accessibility (2 tests)**
   - Keyboard navigation
   - ARIA labels

9. **Error Handling (3 tests)**
   - 404 page
   - Network errors
   - Invalid instructor

10. **Performance (2 tests)**
    - Page load time
    - Calendar render time

11. **Form Validation (2 tests)**
    - Coaching form validation
    - Business hours validation

## Test Data Management

### Test Data Cleanup

All tests use fixtures that automatically clean up test data after execution. This ensures:
- No test data pollution
- Repeatable test runs
- Isolated test execution

### Test Helpers (config.py)

The `config.py` module provides:

- **TestConfig**: Central configuration management
- **SupabaseTestClient**: Helper methods for database operations
- **TestDataGenerator**: Generate realistic test data

Example usage:
```python
from config import get_test_client, TestDataGenerator

# Get a test client
client = get_test_client(use_service_role=True)

# Create test user
user = client.create_test_user(
    email="test@example.com",
    name="Test User",
    user_type="instructor"
)

# Generate business hours
hours = TestDataGenerator.generate_business_hours()
```

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/qa.yml`:

```yaml
name: QA Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        cd qa
        pip install -r requirements.txt
        playwright install --with-deps chromium

    - name: Run tests
      env:
        VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      run: |
        cd qa
        ./run_tests.sh --parallel --coverage

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: qa/reports/

    - name: Upload coverage
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: coverage-report
        path: qa/coverage/
```

## Reports

### HTML Test Report

After running tests, open the HTML report:
```bash
open reports/test_report.html  # macOS
xdg-open reports/test_report.html  # Linux
start reports/test_report.html  # Windows
```

The report includes:
- Pass/fail status for each test
- Execution time
- Error messages and tracebacks
- Screenshots (for UI tests)

### Coverage Report

If run with `--coverage`:
```bash
open coverage/index.html
```

Shows:
- Line coverage percentages
- Uncovered lines
- Branch coverage

## Troubleshooting

### Common Issues

1. **Import errors**
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

2. **Supabase connection errors**
   - Check `.env` file configuration
   - Verify Supabase URL and keys
   - Ensure Supabase project is running

3. **Playwright browser not found**
   - Run `playwright install chromium`

4. **Permission denied on run_tests.sh**
   - Run `chmod +x run_tests.sh`

5. **Tests fail due to RLS policies**
   - Use service role key for admin operations
   - Check RLS policies in Supabase

### Debug Mode

Run tests with verbose output and debug info:
```bash
pytest -vv -s test_api.py
```

### Skip Slow Tests

Mark tests as slow and skip them:
```python
@pytest.mark.slow
def test_long_running_operation():
    pass
```

Run without slow tests:
```bash
pytest -m "not slow"
```

## Best Practices

1. **Always clean up test data** - Use fixtures with cleanup
2. **Use meaningful test names** - Describe what is being tested
3. **Keep tests independent** - No test should depend on another
4. **Mock external services** - Don't rely on external APIs
5. **Test edge cases** - Include negative tests
6. **Use assertions effectively** - Clear failure messages
7. **Maintain test data** - Keep test data realistic

## Contributing

When adding new tests:

1. Follow existing test structure
2. Add appropriate fixtures for setup/cleanup
3. Update this README with new test coverage
4. Ensure tests pass locally before committing
5. Add type hints where appropriate

## License

Same as the main project.

## Contact

For questions or issues with the test suite, contact the development team.

---

**Total Test Count: ~85 test cases**

Last updated: 2024-12-21
