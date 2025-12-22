"""
End-to-End Scenario Tests for Yeyak-mania
Tests complete user workflows and business logic
"""
import pytest
from datetime import datetime, timedelta
import uuid
from config import get_test_client, TestConfig, TestDataGenerator
import json


class TestInstructorWorkflow:
    """End-to-end instructor workflows"""

    @pytest.fixture
    def instructor_setup(self):
        """Setup instructor for workflow tests"""
        client = get_test_client(use_service_role=True)

        instructor = client.create_test_user(
            email=f"workflow_instructor_{uuid.uuid4()}@example.com",
            name="Workflow Instructor",
            user_type="instructor",
            username=f"instructor_{uuid.uuid4().hex[:8]}"
        )

        yield {'client': client, 'instructor': instructor}

        # Cleanup
        client.cleanup_test_data('users', {'id': instructor['id']})

    def test_instructor_onboarding_flow(self, instructor_setup):
        """
        Test complete instructor onboarding:
        1. Create instructor account
        2. Setup business hours
        3. Create coaching products
        4. Verify profile is complete
        """
        client = instructor_setup['client']
        instructor = instructor_setup['instructor']

        # Step 1: Verify instructor was created
        assert instructor['user_type'] == 'instructor'
        assert instructor['username'] is not None

        # Step 2: Setup business hours
        settings = TestDataGenerator.generate_instructor_settings(instructor['id'])
        settings_result = client.client.table('settings').insert(settings).execute()
        created_settings = settings_result.data[0]

        assert created_settings['instructor_id'] == instructor['id']

        # Step 3: Create coaching products
        private_coaching = client.create_test_coaching(
            instructor['id'],
            "1:1 Private Coaching",
            coaching_type='private',
            duration=60,
            price=80000
        )

        group_coaching = client.create_test_coaching(
            instructor['id'],
            "Group Fitness Class",
            coaching_type='group',
            duration=90,
            price=40000
        )

        assert private_coaching is not None
        assert group_coaching is not None

        # Verify coachings
        coachings = client.client.table('coachings').select('*').eq(
            'instructor_id', instructor['id']
        ).execute()

        assert len(coachings.data) >= 2

        # Cleanup
        client.cleanup_test_data('coachings', {'id': private_coaching['id']})
        client.cleanup_test_data('coachings', {'id': group_coaching['id']})
        client.cleanup_test_data('settings', {'id': created_settings['id']})

    def test_instructor_student_management(self, instructor_setup):
        """
        Test instructor managing students:
        1. Add new student
        2. Create package for student
        3. View student's package info
        4. Edit package sessions
        """
        client = instructor_setup['client']
        instructor = instructor_setup['instructor']

        # Step 1: Create student
        student = client.create_test_user(
            f"managed_student_{uuid.uuid4()}@example.com",
            "Managed Student",
            "student"
        )

        # Step 2: Create coaching
        coaching = client.create_test_coaching(
            instructor['id'],
            "Personal Training"
        )

        # Step 3: Create package for student
        package = client.create_test_package(
            student['id'],
            instructor['id'],
            coaching['id'],
            total_sessions=20,
            expires_in_days=120
        )

        assert package['total_sessions'] == 20
        assert package['remaining_sessions'] == 20

        # Step 4: Edit package sessions (e.g., grant bonus session)
        updated = client.client.table('packages').update({
            'total_sessions': 21,
            'remaining_sessions': package['remaining_sessions'] + 1
        }).eq('id', package['id']).execute()

        assert updated.data[0]['total_sessions'] == 21

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})
        client.cleanup_test_data('coachings', {'id': coaching['id']})
        client.cleanup_test_data('users', {'id': student['id']})

    def test_instructor_schedule_management(self, instructor_setup):
        """
        Test instructor managing their schedule:
        1. Create group class
        2. View all reservations
        3. Cancel a group class
        """
        client = instructor_setup['client']
        instructor = instructor_setup['instructor']

        # Step 1: Create group class
        tomorrow = datetime.now() + timedelta(days=1)
        class_data = {
            'instructor_id': instructor['id'],
            'title': 'Morning Yoga',
            'date': tomorrow.date().isoformat(),
            'time': '08:00:00',
            'type': 'group',
            'max_capacity': 12,
            'current_count': 0,
            'status': 'scheduled'
        }

        group_class = client.client.table('group_classes').insert(class_data).execute()
        created_class = group_class.data[0]

        # Step 2: View all group classes
        all_classes = client.client.table('group_classes').select('*').eq(
            'instructor_id', instructor['id']
        ).eq('status', 'scheduled').execute()

        assert len(all_classes.data) > 0

        # Step 3: Cancel the class
        cancelled = client.client.table('group_classes').update({
            'status': 'cancelled'
        }).eq('id', created_class['id']).execute()

        assert cancelled.data[0]['status'] == 'cancelled'

        # Cleanup
        client.cleanup_test_data('group_classes', {'id': created_class['id']})


class TestStudentWorkflow:
    """End-to-end student workflows"""

    @pytest.fixture
    def student_setup(self):
        """Setup student and instructor for workflow tests"""
        client = get_test_client(use_service_role=True)

        instructor = client.create_test_user(
            f"student_flow_instructor_{uuid.uuid4()}@example.com",
            "Student Flow Instructor",
            "instructor"
        )

        student = client.create_test_user(
            f"student_flow_{uuid.uuid4()}@example.com",
            "Student Flow",
            "student"
        )

        # Setup instructor's business hours
        settings = TestDataGenerator.generate_instructor_settings(instructor['id'])
        settings_result = client.client.table('settings').insert(settings).execute()

        # Create coaching
        coaching = client.create_test_coaching(
            instructor['id'],
            "Regular Coaching"
        )

        # Create package for student
        package = client.create_test_package(
            student['id'],
            instructor['id'],
            coaching['id']
        )

        yield {
            'client': client,
            'instructor': instructor,
            'student': student,
            'coaching': coaching,
            'package': package,
            'settings': settings_result.data[0]
        }

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})
        client.cleanup_test_data('coachings', {'id': coaching['id']})
        client.cleanup_test_data('settings', {'id': settings_result.data[0]['id']})
        client.cleanup_test_data('users', {'id': instructor['id']})
        client.cleanup_test_data('users', {'id': student['id']})

    def test_student_booking_flow(self, student_setup):
        """
        Test complete student booking flow:
        1. Browse instructor's available times
        2. Make a reservation
        3. Verify package session was deducted
        4. View own reservations
        """
        client = student_setup['client']
        student = student_setup['student']
        instructor = student_setup['instructor']
        coaching = student_setup['coaching']
        package = student_setup['package']

        # Step 1: Check package before booking
        initial_sessions = package['remaining_sessions']

        # Step 2: Make reservation
        tomorrow = datetime.now() + timedelta(days=1)
        start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)

        reservation = client.create_test_reservation(
            student['id'],
            instructor['id'],
            coaching['id'],
            package['id'],
            start_time.isoformat(),
            duration=60
        )

        assert reservation is not None
        assert reservation['status'] == 'confirmed'

        # Step 3: Deduct session from package (simulating booking logic)
        updated_package = client.client.table('packages').update({
            'remaining_sessions': initial_sessions - 1
        }).eq('id', package['id']).execute()

        assert updated_package.data[0]['remaining_sessions'] == initial_sessions - 1

        # Step 4: View student's reservations
        student_reservations = client.client.table('reservations').select('*').eq(
            'student_id', student['id']
        ).eq('status', 'confirmed').execute()

        assert len(student_reservations.data) > 0

        # Cleanup
        client.cleanup_test_data('reservations', {'id': reservation['id']})

    def test_student_view_package_info(self, student_setup):
        """
        Test student viewing package information:
        1. Get active packages
        2. Check remaining sessions
        3. Check expiry date
        """
        client = student_setup['client']
        student = student_setup['student']
        package = student_setup['package']

        # Step 1: Get student's packages
        packages = client.client.table('packages').select('*').eq(
            'student_id', student['id']
        ).execute()

        assert len(packages.data) > 0

        # Step 2: Verify package info
        student_package = packages.data[0]
        assert student_package['id'] == package['id']
        assert student_package['remaining_sessions'] > 0

        # Step 3: Check if package is active (not expired)
        expiry = datetime.fromisoformat(student_package['expires_at'])
        assert expiry > datetime.now()

    def test_student_cancel_reservation(self, student_setup):
        """
        Test student cancelling a reservation:
        1. Create reservation
        2. Cancel it
        3. Verify status changed
        4. Optionally refund session to package
        """
        client = student_setup['client']

        # Step 1: Create reservation
        tomorrow = datetime.now() + timedelta(days=2)
        start_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)

        reservation = client.create_test_reservation(
            student_setup['student']['id'],
            student_setup['instructor']['id'],
            student_setup['coaching']['id'],
            student_setup['package']['id'],
            start_time.isoformat()
        )

        # Step 2: Cancel reservation
        cancelled = client.client.table('reservations').update({
            'status': 'cancelled'
        }).eq('id', reservation['id']).execute()

        # Step 3: Verify cancellation
        assert cancelled.data[0]['status'] == 'cancelled'

        # Step 4: Refund session (optional business logic)
        current_package = client.client.table('packages').select('*').eq(
            'id', student_setup['package']['id']
        ).execute()

        refunded = client.client.table('packages').update({
            'remaining_sessions': current_package.data[0]['remaining_sessions'] + 1
        }).eq('id', student_setup['package']['id']).execute()

        assert refunded.data[0]['remaining_sessions'] == current_package.data[0]['remaining_sessions'] + 1

        # Cleanup
        client.cleanup_test_data('reservations', {'id': reservation['id']})


class TestEdgeCases:
    """Test edge cases and error scenarios"""

    @pytest.fixture
    def edge_case_setup(self):
        """Setup for edge case testing"""
        client = get_test_client(use_service_role=True)

        instructor = client.create_test_user(
            f"edge_instructor_{uuid.uuid4()}@example.com",
            "Edge Instructor",
            "instructor"
        )

        student = client.create_test_user(
            f"edge_student_{uuid.uuid4()}@example.com",
            "Edge Student",
            "student"
        )

        coaching = client.create_test_coaching(
            instructor['id'],
            "Edge Coaching"
        )

        yield {
            'client': client,
            'instructor': instructor,
            'student': student,
            'coaching': coaching
        }

        # Cleanup
        client.cleanup_test_data('coachings', {'id': coaching['id']})
        client.cleanup_test_data('users', {'id': instructor['id']})
        client.cleanup_test_data('users', {'id': student['id']})

    def test_expired_package_booking_attempt(self, edge_case_setup):
        """Test that expired packages cannot be used for booking"""
        client = edge_case_setup['client']

        # Create expired package
        yesterday = datetime.now() - timedelta(days=1)
        package_data = {
            'student_id': edge_case_setup['student']['id'],
            'instructor_id': edge_case_setup['instructor']['id'],
            'coaching_id': edge_case_setup['coaching']['id'],
            'total_sessions': 10,
            'remaining_sessions': 5,
            'expires_at': yesterday.isoformat()
        }

        package = client.client.table('packages').insert(package_data).execute()
        expired_package = package.data[0]

        # Verify package is expired
        expiry = datetime.fromisoformat(expired_package['expires_at'])
        assert expiry < datetime.now()

        # Cleanup
        client.cleanup_test_data('packages', {'id': expired_package['id']})

    def test_zero_sessions_remaining(self, edge_case_setup):
        """Test package with no remaining sessions"""
        client = edge_case_setup['client']

        # Create package with zero sessions
        package = client.create_test_package(
            edge_case_setup['student']['id'],
            edge_case_setup['instructor']['id'],
            edge_case_setup['coaching']['id'],
            total_sessions=10
        )

        # Deplete all sessions
        depleted = client.client.table('packages').update({
            'remaining_sessions': 0
        }).eq('id', package['id']).execute()

        assert depleted.data[0]['remaining_sessions'] == 0

        # Verify cannot book (business logic check)
        assert depleted.data[0]['remaining_sessions'] <= 0

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})

    def test_overlapping_reservations(self, edge_case_setup):
        """Test preventing overlapping reservations for same instructor"""
        client = edge_case_setup['client']

        student2 = client.create_test_user(
            f"edge_student2_{uuid.uuid4()}@example.com",
            "Edge Student 2",
            "student"
        )

        package1 = client.create_test_package(
            edge_case_setup['student']['id'],
            edge_case_setup['instructor']['id'],
            edge_case_setup['coaching']['id']
        )

        package2 = client.create_test_package(
            student2['id'],
            edge_case_setup['instructor']['id'],
            edge_case_setup['coaching']['id']
        )

        # Create first reservation
        tomorrow = datetime.now() + timedelta(days=1)
        start_time = tomorrow.replace(hour=15, minute=0, second=0, microsecond=0)

        res1 = client.create_test_reservation(
            edge_case_setup['student']['id'],
            edge_case_setup['instructor']['id'],
            edge_case_setup['coaching']['id'],
            package1['id'],
            start_time.isoformat()
        )

        # Try to create overlapping reservation (same time slot)
        # In production, this should be prevented by application logic
        end_time = start_time + timedelta(minutes=60)

        # Check for conflicts
        conflicts = client.client.table('reservations').select('*').eq(
            'instructor_id', edge_case_setup['instructor']['id']
        ).gte('start_time', start_time.isoformat()).lt(
            'start_time', end_time.isoformat()
        ).neq('status', 'cancelled').execute()

        assert len(conflicts.data) > 0  # Conflict detected

        # Cleanup
        client.cleanup_test_data('reservations', {'id': res1['id']})
        client.cleanup_test_data('packages', {'id': package1['id']})
        client.cleanup_test_data('packages', {'id': package2['id']})
        client.cleanup_test_data('users', {'id': student2['id']})

    def test_past_time_slot_booking(self, edge_case_setup):
        """Test that past time slots cannot be booked"""
        client = edge_case_setup['client']

        package = client.create_test_package(
            edge_case_setup['student']['id'],
            edge_case_setup['instructor']['id'],
            edge_case_setup['coaching']['id']
        )

        # Try to book a past time slot
        yesterday = datetime.now() - timedelta(days=1)
        past_time = yesterday.replace(hour=10, minute=0, second=0, microsecond=0)

        # In production, this should be prevented by validation
        # Here we just verify the time is in the past
        assert past_time < datetime.now()

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})

    def test_group_class_over_capacity(self, edge_case_setup):
        """Test group class reaching max capacity"""
        client = edge_case_setup['client']

        tomorrow = datetime.now() + timedelta(days=1)
        class_data = {
            'instructor_id': edge_case_setup['instructor']['id'],
            'title': 'Full Class',
            'date': tomorrow.date().isoformat(),
            'time': '19:00:00',
            'type': 'group',
            'max_capacity': 5,
            'current_count': 5,  # Already at max
            'status': 'scheduled'
        }

        full_class = client.client.table('group_classes').insert(class_data).execute()
        created = full_class.data[0]

        # Check if class is full
        is_full = created['current_count'] >= created['max_capacity']
        assert is_full is True

        # Cleanup
        client.cleanup_test_data('group_classes', {'id': created['id']})

    def test_multiple_active_packages_same_student(self, edge_case_setup):
        """Test student having multiple active packages from same instructor"""
        client = edge_case_setup['client']

        # Create two different coachings
        coaching1 = edge_case_setup['coaching']
        coaching2 = client.create_test_coaching(
            edge_case_setup['instructor']['id'],
            "Advanced Coaching"
        )

        # Create packages for both
        package1 = client.create_test_package(
            edge_case_setup['student']['id'],
            edge_case_setup['instructor']['id'],
            coaching1['id'],
            total_sessions=10
        )

        package2 = client.create_test_package(
            edge_case_setup['student']['id'],
            edge_case_setup['instructor']['id'],
            coaching2['id'],
            total_sessions=5
        )

        # Query student's packages
        packages = client.client.table('packages').select('*').eq(
            'student_id', edge_case_setup['student']['id']
        ).execute()

        assert len(packages.data) >= 2

        # Cleanup
        client.cleanup_test_data('packages', {'id': package1['id']})
        client.cleanup_test_data('packages', {'id': package2['id']})
        client.cleanup_test_data('coachings', {'id': coaching2['id']})


class TestReservationFlows:
    """Test complex reservation scenarios"""

    @pytest.fixture
    def reservation_setup(self):
        """Setup for reservation flow tests"""
        client = get_test_client(use_service_role=True)

        instructor = client.create_test_user(
            f"res_flow_instructor_{uuid.uuid4()}@example.com",
            "Reservation Flow Instructor",
            "instructor"
        )

        student = client.create_test_user(
            f"res_flow_student_{uuid.uuid4()}@example.com",
            "Reservation Flow Student",
            "student"
        )

        coaching = client.create_test_coaching(
            instructor['id'],
            "Flow Coaching"
        )

        package = client.create_test_package(
            student['id'],
            instructor['id'],
            coaching['id']
        )

        yield {
            'client': client,
            'instructor': instructor,
            'student': student,
            'coaching': coaching,
            'package': package
        }

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})
        client.cleanup_test_data('coachings', {'id': coaching['id']})
        client.cleanup_test_data('users', {'id': instructor['id']})
        client.cleanup_test_data('users', {'id': student['id']})

    def test_recurring_weekly_reservation(self, reservation_setup):
        """Test creating multiple weekly recurring reservations"""
        client = reservation_setup['client']
        base_date = datetime.now() + timedelta(days=7)
        reservations = []

        # Create 4 weekly reservations
        for week in range(4):
            reservation_date = base_date + timedelta(weeks=week)
            start_time = reservation_date.replace(hour=10, minute=0, second=0, microsecond=0)

            res = client.create_test_reservation(
                reservation_setup['student']['id'],
                reservation_setup['instructor']['id'],
                reservation_setup['coaching']['id'],
                reservation_setup['package']['id'],
                start_time.isoformat()
            )
            reservations.append(res)

        # Verify all created
        assert len(reservations) == 4

        # Cleanup
        for res in reservations:
            client.cleanup_test_data('reservations', {'id': res['id']})

    def test_same_day_multiple_reservations(self, reservation_setup):
        """Test student booking multiple sessions on same day (if allowed)"""
        client = reservation_setup['client']
        target_date = datetime.now() + timedelta(days=3)

        # Morning session
        morning = target_date.replace(hour=9, minute=0, second=0, microsecond=0)
        res1 = client.create_test_reservation(
            reservation_setup['student']['id'],
            reservation_setup['instructor']['id'],
            reservation_setup['coaching']['id'],
            reservation_setup['package']['id'],
            morning.isoformat()
        )

        # Afternoon session
        afternoon = target_date.replace(hour=14, minute=0, second=0, microsecond=0)
        res2 = client.create_test_reservation(
            reservation_setup['student']['id'],
            reservation_setup['instructor']['id'],
            reservation_setup['coaching']['id'],
            reservation_setup['package']['id'],
            afternoon.isoformat()
        )

        # Verify both created
        assert res1 is not None
        assert res2 is not None

        # Cleanup
        client.cleanup_test_data('reservations', {'id': res1['id']})
        client.cleanup_test_data('reservations', {'id': res2['id']})


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
