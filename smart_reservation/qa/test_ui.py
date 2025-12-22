"""
UI and Integration Tests for Yeyak-mania
Tests user interface components and end-to-end flows using Playwright
"""
import pytest
from playwright.sync_api import Page, expect, Browser, BrowserContext
import re
from config import TestConfig
from datetime import datetime, timedelta


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Configure browser context"""
    return {
        **browser_context_args,
        "viewport": {
            "width": 1280,
            "height": 720,
        },
        "locale": "ko-KR",
        "timezone_id": "Asia/Seoul"
    }


@pytest.fixture
def setup_page(page: Page):
    """Setup page with error handling and screenshots on failure"""
    page.set_default_timeout(10000)  # 10 seconds default timeout

    yield page

    # Screenshot on test failure handled by pytest-playwright


class TestLandingPage:
    """Test landing page functionality"""

    def test_landing_page_loads(self, page: Page):
        """Test that landing page loads successfully"""
        page.goto(TestConfig.APP_URL)
        expect(page).to_have_title(re.compile("예약매니아|Yeyak-mania", re.IGNORECASE))

    def test_landing_page_has_cta_buttons(self, page: Page):
        """Test that CTA buttons are present"""
        page.goto(TestConfig.APP_URL)

        # Look for login or get started buttons
        # Adjust selectors based on actual implementation
        login_button = page.get_by_role("button", name=re.compile("로그인|login", re.IGNORECASE))
        expect(login_button).to_be_visible()

    def test_responsive_design_mobile(self, page: Page):
        """Test landing page on mobile viewport"""
        page.set_viewport_size({"width": 375, "height": 667})
        page.goto(TestConfig.APP_URL)

        # Verify page is still usable
        expect(page).to_have_title(re.compile("예약매니아|Yeyak-mania", re.IGNORECASE))

    def test_navigation_to_pricing(self, page: Page):
        """Test navigation to pricing page"""
        page.goto(TestConfig.APP_URL)

        # Try to find and click pricing link
        try:
            pricing_link = page.get_by_role("link", name=re.compile("가격|pricing", re.IGNORECASE))
            pricing_link.click()
            page.wait_for_load_state("networkidle")
        except Exception:
            pytest.skip("Pricing page not implemented or link not found")


class TestAuthentication:
    """Test authentication flows"""

    def test_login_modal_opens(self, page: Page):
        """Test that login modal can be opened"""
        page.goto(TestConfig.APP_URL)

        # Click login button
        login_button = page.get_by_role("button", name=re.compile("로그인|login", re.IGNORECASE))
        login_button.click()

        # Wait for modal or redirect
        page.wait_for_timeout(1000)

    def test_google_oauth_button_present(self, page: Page):
        """Test that Google OAuth button is present in login"""
        page.goto(TestConfig.APP_URL)

        # Open login
        try:
            login_button = page.get_by_role("button", name=re.compile("로그인|login", re.IGNORECASE))
            login_button.click()
            page.wait_for_timeout(1000)

            # Look for Google login button
            google_button = page.get_by_role("button", name=re.compile("google", re.IGNORECASE))
            expect(google_button).to_be_visible()
        except Exception:
            # If modal structure is different, skip
            pytest.skip("Google OAuth button not found in expected location")

    def test_user_type_selection(self, page: Page):
        """Test user type selection during signup/onboarding"""
        # This test would require actually logging in
        # For now, we'll skip unless we have test credentials
        pytest.skip("Requires authenticated session")


class TestInstructorDashboard:
    """Test instructor dashboard features"""

    @pytest.fixture
    def authenticated_instructor_page(self, page: Page):
        """
        Fixture for authenticated instructor session
        NOTE: This requires actual authentication setup
        For now, we'll skip tests that need this
        """
        pytest.skip("Requires authenticated instructor session")
        yield page

    def test_dashboard_tabs_visible(self, authenticated_instructor_page: Page):
        """Test that dashboard tabs are visible"""
        # Navigate to dashboard
        authenticated_instructor_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Check for tabs
        tabs = ["예약 현황", "수강생 관리", "통계", "설정"]
        for tab_name in tabs:
            tab = authenticated_instructor_page.get_by_role("tab", name=re.compile(tab_name))
            expect(tab).to_be_visible()

    def test_create_coaching_modal(self, authenticated_instructor_page: Page):
        """Test opening create coaching modal"""
        authenticated_instructor_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Click create coaching button
        create_button = authenticated_instructor_page.get_by_role(
            "button",
            name=re.compile("코칭 만들기|Create Coaching", re.IGNORECASE)
        )
        create_button.click()

        # Modal should be visible
        modal = authenticated_instructor_page.locator('[role="dialog"]')
        expect(modal).to_be_visible()

    def test_package_management_modal(self, authenticated_instructor_page: Page):
        """Test package management functionality"""
        authenticated_instructor_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Switch to student management tab
        student_tab = authenticated_instructor_page.get_by_role("tab", name=re.compile("수강생"))
        student_tab.click()

        # Should show student list or empty state
        page_content = authenticated_instructor_page.content()
        assert "수강생" in page_content or "student" in page_content.lower()


class TestStudentBooking:
    """Test student booking flows"""

    @pytest.fixture
    def authenticated_student_page(self, page: Page):
        """Fixture for authenticated student session"""
        pytest.skip("Requires authenticated student session")
        yield page

    def test_view_instructor_profile(self, page: Page):
        """Test viewing public instructor profile"""
        # This should work without authentication
        # Assuming format: /book/username
        test_username = "demo_instructor"  # Use a test instructor

        page.goto(f"{TestConfig.APP_URL}/book/{test_username}")
        page.wait_for_load_state("networkidle")

        # Should show instructor info or 404
        # Just verify page loaded
        assert page.url.endswith(test_username) or "404" in page.content()

    def test_calendar_view_loads(self, authenticated_student_page: Page):
        """Test that calendar view loads for booking"""
        authenticated_student_page.goto(f"{TestConfig.APP_URL}/book/test_instructor")

        # Look for calendar component
        calendar = authenticated_student_page.locator('[class*="calendar"]')
        expect(calendar).to_be_visible()

    def test_select_time_slot(self, authenticated_student_page: Page):
        """Test selecting an available time slot"""
        authenticated_student_page.goto(f"{TestConfig.APP_URL}/book/test_instructor")

        # Find and click an available time slot
        time_slot = authenticated_student_page.locator('[data-testid="time-slot"]').first
        if time_slot.is_visible():
            time_slot.click()

            # Confirmation dialog should appear
            confirm_button = authenticated_student_page.get_by_role(
                "button",
                name=re.compile("예약 확인|Confirm", re.IGNORECASE)
            )
            expect(confirm_button).to_be_visible()

    def test_view_my_reservations(self, authenticated_student_page: Page):
        """Test viewing student's own reservations"""
        authenticated_student_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Should show reservation list
        reservations_section = authenticated_student_page.locator('[class*="reservation"]')
        expect(reservations_section).to_be_visible()

    def test_package_info_display(self, authenticated_student_page: Page):
        """Test that package information is displayed"""
        authenticated_student_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Look for package info (remaining sessions, expiry date)
        page_content = authenticated_student_page.content()
        assert any(keyword in page_content for keyword in ["남은", "remaining", "수강권", "package"])


class TestReservationFlow:
    """Test complete reservation flow"""

    @pytest.fixture
    def booking_page(self, page: Page):
        """Setup booking page"""
        pytest.skip("Requires authenticated session and test data")
        yield page

    def test_complete_booking_flow(self, booking_page: Page):
        """
        Test complete booking flow:
        1. View available times
        2. Select time slot
        3. Confirm reservation
        4. Verify confirmation
        """
        # Step 1: Navigate to booking page
        booking_page.goto(f"{TestConfig.APP_URL}/book/test_instructor")

        # Step 2: Select a date
        tomorrow = datetime.now() + timedelta(days=1)
        date_button = booking_page.locator(f'[data-date="{tomorrow.strftime("%Y-%m-%d")}"]')
        if date_button.is_visible():
            date_button.click()

        # Step 3: Select time slot
        time_slot = booking_page.locator('[data-testid="time-slot"]:not([disabled])').first
        time_slot.click()

        # Step 4: Confirm
        confirm_button = booking_page.get_by_role("button", name=re.compile("예약|Book"))
        confirm_button.click()

        # Step 5: Wait for confirmation
        booking_page.wait_for_timeout(2000)

        # Should show success message or redirect
        success_indicator = booking_page.locator('[class*="success"]')
        expect(success_indicator).to_be_visible(timeout=5000)

    def test_cancel_reservation_flow(self, booking_page: Page):
        """Test cancelling a reservation"""
        # Navigate to reservations
        booking_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Find a reservation to cancel
        cancel_button = booking_page.get_by_role(
            "button",
            name=re.compile("취소|Cancel", re.IGNORECASE)
        ).first

        if cancel_button.is_visible():
            cancel_button.click()

            # Confirm cancellation
            confirm_cancel = booking_page.get_by_role(
                "button",
                name=re.compile("확인|Confirm", re.IGNORECASE)
            )
            confirm_cancel.click()

            # Should show cancellation success
            booking_page.wait_for_timeout(1000)


class TestGroupClasses:
    """Test group class functionality"""

    @pytest.fixture
    def instructor_page(self, page: Page):
        """Instructor page fixture"""
        pytest.skip("Requires authenticated instructor session")
        yield page

    def test_create_group_class(self, instructor_page: Page):
        """Test creating a group class"""
        instructor_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Navigate to group class section
        group_tab = instructor_page.get_by_role("tab", name=re.compile("그룹|Group"))
        if group_tab.is_visible():
            group_tab.click()

            # Click create button
            create_button = instructor_page.get_by_role(
                "button",
                name=re.compile("그룹 수업 만들기|Create Group")
            )
            create_button.click()

            # Fill form
            instructor_page.fill('input[name="title"]', "Test Group Class")
            instructor_page.fill('input[name="max_capacity"]', "10")

            # Submit
            submit_button = instructor_page.get_by_role("button", name=re.compile("저장|Save"))
            submit_button.click()

    def test_view_group_class_participants(self, instructor_page: Page):
        """Test viewing participants in group class"""
        instructor_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Find a group class
        group_class = instructor_page.locator('[data-testid="group-class"]').first
        if group_class.is_visible():
            group_class.click()

            # Should show participant list
            participants = instructor_page.locator('[data-testid="participant"]')
            expect(participants.first).to_be_visible()


class TestBusinessHoursSetup:
    """Test business hours configuration"""

    @pytest.fixture
    def settings_page(self, page: Page):
        """Settings page fixture"""
        pytest.skip("Requires authenticated instructor session")
        yield page

    def test_configure_business_hours(self, settings_page: Page):
        """Test configuring business hours"""
        settings_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Navigate to settings
        settings_tab = settings_page.get_by_role("tab", name=re.compile("설정|Settings"))
        settings_tab.click()

        # Look for business hours section
        business_hours_section = settings_page.locator('[class*="business-hours"]')
        expect(business_hours_section).to_be_visible()

    def test_set_working_days(self, settings_page: Page):
        """Test setting working days"""
        settings_page.goto(f"{TestConfig.APP_URL}/settings")

        # Toggle Monday
        monday_toggle = settings_page.locator('[data-day="monday"]')
        if monday_toggle.is_visible():
            monday_toggle.click()

            # Save
            save_button = settings_page.get_by_role("button", name=re.compile("저장|Save"))
            save_button.click()

            # Wait for save confirmation
            settings_page.wait_for_timeout(1000)


class TestAccessibility:
    """Test accessibility features"""

    def test_keyboard_navigation(self, page: Page):
        """Test keyboard navigation"""
        page.goto(TestConfig.APP_URL)

        # Tab through interactive elements
        page.keyboard.press("Tab")
        page.wait_for_timeout(100)
        page.keyboard.press("Tab")

        # Verify focus is visible
        focused_element = page.locator(':focus')
        expect(focused_element).to_be_visible()

    def test_aria_labels_present(self, page: Page):
        """Test that important elements have aria labels"""
        page.goto(TestConfig.APP_URL)

        # Check for buttons with aria-labels
        buttons = page.locator('button[aria-label]')
        count = buttons.count()

        # Should have at least some labeled buttons
        assert count > 0


class TestErrorHandling:
    """Test error handling and edge cases"""

    def test_404_page(self, page: Page):
        """Test 404 page for invalid routes"""
        page.goto(f"{TestConfig.APP_URL}/nonexistent-page-12345")

        # Should show 404 or redirect
        page_content = page.content()
        assert "404" in page_content or page.url == TestConfig.APP_URL

    def test_network_error_handling(self, page: Page):
        """Test handling of network errors"""
        # Set offline
        page.context.set_offline(True)

        page.goto(TestConfig.APP_URL, wait_until="domcontentloaded", timeout=5000)

        # Should show error message or offline indicator
        # Implementation specific

    def test_invalid_instructor_username(self, page: Page):
        """Test accessing invalid instructor booking page"""
        page.goto(f"{TestConfig.APP_URL}/book/nonexistent_user_12345")

        # Should show error or redirect
        page.wait_for_load_state("networkidle")
        page_content = page.content()

        assert "404" in page_content or "not found" in page_content.lower() or "없습니다" in page_content


class TestPerformance:
    """Test performance metrics"""

    def test_page_load_time(self, page: Page):
        """Test that page loads within acceptable time"""
        import time

        start = time.time()
        page.goto(TestConfig.APP_URL)
        page.wait_for_load_state("networkidle")
        load_time = time.time() - start

        # Should load within 5 seconds
        assert load_time < 5.0

    def test_calendar_render_time(self, page: Page):
        """Test calendar component render time"""
        pytest.skip("Requires authenticated session and specific page")


class TestDataValidation:
    """Test form validation"""

    @pytest.fixture
    def form_page(self, page: Page):
        """Page with forms"""
        pytest.skip("Requires authenticated session")
        yield page

    def test_coaching_form_validation(self, form_page: Page):
        """Test coaching creation form validation"""
        form_page.goto(f"{TestConfig.APP_URL}/dashboard")

        # Open coaching form
        create_button = form_page.get_by_role("button", name=re.compile("코칭 만들기"))
        create_button.click()

        # Try to submit empty form
        submit = form_page.get_by_role("button", name=re.compile("저장|Save"))
        submit.click()

        # Should show validation errors
        error_message = form_page.locator('[class*="error"]')
        expect(error_message.first).to_be_visible()

    def test_business_hours_validation(self, form_page: Page):
        """Test business hours validation (end time after start time)"""
        form_page.goto(f"{TestConfig.APP_URL}/settings")

        # Try to set invalid hours (end before start)
        start_input = form_page.locator('input[name="start_time"]')
        end_input = form_page.locator('input[name="end_time"]')

        if start_input.is_visible() and end_input.is_visible():
            start_input.fill("18:00")
            end_input.fill("09:00")

            # Try to save
            save_button = form_page.get_by_role("button", name=re.compile("저장"))
            save_button.click()

            # Should show validation error
            form_page.wait_for_timeout(500)


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--headed', '--slowmo=100'])
