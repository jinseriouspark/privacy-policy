# Complete Test Cases Reference

## Test API (test_api.py) - 35 Test Cases

### TestDatabaseConnectivity (3 tests)
- ✓ `test_config_validation` - Validates environment variables are set
- ✓ `test_supabase_connection` - Tests basic Supabase connectivity
- ✓ `test_service_role_connection` - Tests admin-level connection

### TestUserOperations (5 tests)
- ✓ `test_create_instructor_user` - Creates instructor account
- ✓ `test_create_student_user` - Creates student account
- ✓ `test_user_email_uniqueness` - Validates unique email constraint
- ✓ `test_get_user_by_email` - Retrieves user by email address
- ✓ `test_update_user_profile` - Updates user bio and profile

### TestCoachingOperations (4 tests)
- ✓ `test_create_private_coaching` - Creates 1:1 coaching product
- ✓ `test_create_group_coaching` - Creates group coaching product
- ✓ `test_list_active_coachings` - Lists all active coachings
- ✓ `test_deactivate_coaching` - Deactivates coaching product

### TestPackageOperations (4 tests)
- ✓ `test_create_package` - Creates student package (수강권)
- ✓ `test_package_session_deduction` - Deducts sessions from package
- ✓ `test_expired_package_detection` - Detects expired packages
- ✓ `test_package_without_sessions` - Handles zero-session packages

### TestReservationOperations (6 tests)
- ✓ `test_create_reservation` - Creates new reservation
- ✓ `test_reservation_conflict_detection` - Detects time conflicts
- ✓ `test_cancel_reservation` - Cancels existing reservation
- ✓ `test_get_student_reservations` - Gets student's reservations
- ✓ `test_reservation_with_meet_link` - Creates reservation with Google Meet link
- ✓ `test_overlapping_time_validation` - Validates no overlapping slots

### TestInstructorSettings (2 tests)
- ✓ `test_create_instructor_settings` - Creates instructor settings
- ✓ `test_update_business_hours` - Updates working hours

### TestGroupClasses (3 tests)
- ✓ `test_create_group_class` - Creates group class session
- ✓ `test_group_class_capacity_check` - Checks capacity limits
- ✓ `test_increment_class_count` - Increments participant count

---

## Test Scenarios (test_scenarios.py) - 20 Test Cases

### TestInstructorWorkflow (3 tests)
- ✓ `test_instructor_onboarding_flow` - Complete instructor setup
  - Create account
  - Setup business hours
  - Create coaching products
  - Verify profile completion

- ✓ `test_instructor_student_management` - Student management workflow
  - Add new student
  - Create package
  - View package info
  - Edit sessions

- ✓ `test_instructor_schedule_management` - Schedule management
  - Create group class
  - View all reservations
  - Cancel group class

### TestStudentWorkflow (3 tests)
- ✓ `test_student_booking_flow` - Complete booking workflow
  - Browse available times
  - Make reservation
  - Verify session deduction
  - View own reservations

- ✓ `test_student_view_package_info` - Package information viewing
  - Get active packages
  - Check remaining sessions
  - Check expiry date

- ✓ `test_student_cancel_reservation` - Cancellation workflow
  - Create reservation
  - Cancel it
  - Verify status change
  - Refund session (optional)

### TestEdgeCases (6 tests)
- ✓ `test_expired_package_booking_attempt` - Prevents booking with expired package
- ✓ `test_zero_sessions_remaining` - Handles depleted packages
- ✓ `test_overlapping_reservations` - Prevents double-booking
- ✓ `test_past_time_slot_booking` - Prevents booking past times
- ✓ `test_group_class_over_capacity` - Enforces capacity limits
- ✓ `test_multiple_active_packages_same_student` - Multiple package management

### TestReservationFlows (2 tests)
- ✓ `test_recurring_weekly_reservation` - Creates weekly recurring bookings
- ✓ `test_same_day_multiple_reservations` - Multiple bookings same day

---

## Test UI (test_ui.py) - 30 Test Cases

### TestLandingPage (4 tests)
- ✓ `test_landing_page_loads` - Page loads successfully
- ✓ `test_landing_page_has_cta_buttons` - CTA buttons present
- ✓ `test_responsive_design_mobile` - Mobile viewport works
- ✓ `test_navigation_to_pricing` - Pricing page navigation

### TestAuthentication (3 tests)
- ✓ `test_login_modal_opens` - Login modal opens
- ✓ `test_google_oauth_button_present` - Google OAuth button visible
- ✓ `test_user_type_selection` - User type selection works

### TestInstructorDashboard (3 tests)
- ✓ `test_dashboard_tabs_visible` - Dashboard tabs display
- ✓ `test_create_coaching_modal` - Coaching creation modal
- ✓ `test_package_management_modal` - Package management UI

### TestStudentBooking (5 tests)
- ✓ `test_view_instructor_profile` - Public profile viewing
- ✓ `test_calendar_view_loads` - Calendar component loads
- ✓ `test_select_time_slot` - Time slot selection
- ✓ `test_view_my_reservations` - Reservation list viewing
- ✓ `test_package_info_display` - Package info display

### TestReservationFlow (2 tests)
- ✓ `test_complete_booking_flow` - End-to-end booking
  - View available times
  - Select time slot
  - Confirm reservation
  - Verify confirmation

- ✓ `test_cancel_reservation_flow` - Cancellation flow
  - Find reservation
  - Cancel it
  - Confirm cancellation

### TestGroupClasses (2 tests)
- ✓ `test_create_group_class` - Group class creation UI
- ✓ `test_view_group_class_participants` - Participant list viewing

### TestBusinessHoursSetup (2 tests)
- ✓ `test_configure_business_hours` - Business hours configuration
- ✓ `test_set_working_days` - Working day toggles

### TestAccessibility (2 tests)
- ✓ `test_keyboard_navigation` - Keyboard navigation works
- ✓ `test_aria_labels_present` - ARIA labels for screen readers

### TestErrorHandling (3 tests)
- ✓ `test_404_page` - 404 page for invalid routes
- ✓ `test_network_error_handling` - Offline mode handling
- ✓ `test_invalid_instructor_username` - Invalid username handling

### TestPerformance (2 tests)
- ✓ `test_page_load_time` - Page loads under 5 seconds
- ✓ `test_calendar_render_time` - Calendar renders quickly

### TestDataValidation (2 tests)
- ✓ `test_coaching_form_validation` - Form validation errors
- ✓ `test_business_hours_validation` - Time range validation

---

## Test Coverage by Feature

### Authentication & User Management (8 tests)
- User registration: 3 tests
- Login/OAuth: 2 tests
- Profile management: 3 tests

### Coaching Products (7 tests)
- Create/edit coaching: 3 tests
- Coaching types (private/group): 2 tests
- UI for coaching management: 2 tests

### Package Management (11 tests)
- Create packages: 2 tests
- Session tracking: 3 tests
- Expiry handling: 2 tests
- UI for packages: 4 tests

### Reservation System (18 tests)
- Create reservations: 4 tests
- Conflict detection: 3 tests
- Cancellation: 3 tests
- UI for booking: 5 tests
- Edge cases: 3 tests

### Group Classes (8 tests)
- Create group classes: 3 tests
- Capacity management: 2 tests
- Participant tracking: 2 tests
- UI for group classes: 1 test

### Instructor Settings (6 tests)
- Business hours: 4 tests
- Calendar integration: 1 test
- Settings UI: 1 test

### UI/UX (16 tests)
- Landing page: 4 tests
- Dashboard: 3 tests
- Accessibility: 2 tests
- Performance: 2 tests
- Error handling: 3 tests
- Form validation: 2 tests

---

## Test Execution Strategy

### Smoke Tests (Fast - ~2 minutes)
Run these first for quick validation:
```bash
pytest -m smoke -v
```
- Database connectivity
- User creation
- Basic CRUD operations
- Landing page loads

### API Tests (2-3 minutes)
```bash
./run_tests.sh --api-only
```
- All database operations
- Data integrity
- Business logic

### Integration Tests (3-5 minutes)
```bash
./run_tests.sh --scenarios-only
```
- End-to-end workflows
- User journeys
- Edge cases

### UI Tests (5-8 minutes)
```bash
./run_tests.sh --ui-only
```
- User interface
- Interactions
- Visual validation

### Full Suite (10-16 minutes sequential, 5-8 parallel)
```bash
./run_tests.sh --parallel
```

---

## Test Data Matrix

### User Types Covered
- ✓ Instructor
- ✓ Student

### Coaching Types Covered
- ✓ Private (1:1)
- ✓ Group classes

### Reservation States Covered
- ✓ Pending
- ✓ Confirmed
- ✓ Cancelled
- ✓ Completed

### Package States Covered
- ✓ Active (with sessions)
- ✓ Active (expired)
- ✓ Depleted (0 sessions)
- ✓ Multiple packages per student

### Time Scenarios Covered
- ✓ Future bookings
- ✓ Past time validation
- ✓ Overlapping times
- ✓ Recurring bookings
- ✓ Same-day multiple bookings

### Capacity Scenarios Covered
- ✓ Under capacity
- ✓ At capacity
- ✓ Over capacity (error)

---

## Success Criteria

All tests should:
1. ✓ Pass consistently
2. ✓ Clean up test data
3. ✓ Run independently
4. ✓ Complete within timeout
5. ✓ Provide clear error messages
6. ✓ Generate readable reports

---

**Total Test Cases:** 85
**Total Lines of Code:** 2,614
**Estimated Coverage:** ~80% of core features
**Maintenance:** Update as features are added

Last updated: 2024-12-21
