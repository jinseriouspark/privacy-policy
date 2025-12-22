"""
API and Database Tests for Yeyak-mania
Tests all Supabase database operations, CRUD operations, and data integrity
"""
import pytest
from datetime import datetime, timedelta
import uuid
from typing import Dict, Any
from config import get_test_client, TestConfig, TestDataGenerator


class TestDatabaseConnectivity:
    """Test basic database connectivity and configuration"""

    def test_config_validation(self):
        """Test that all required environment variables are set"""
        assert TestConfig.validate() is True

    def test_supabase_connection(self):
        """Test connection to Supabase"""
        client = get_test_client()
        assert client.client is not None

    def test_service_role_connection(self):
        """Test service role connection (admin access)"""
        if not TestConfig.SUPABASE_SERVICE_ROLE_KEY:
            pytest.skip("Service role key not configured")

        client = get_test_client(use_service_role=True)
        assert client.client is not None


class TestUserOperations:
    """Test user table CRUD operations"""

    @pytest.fixture
    def test_client(self):
        """Get test client with service role"""
        return get_test_client(use_service_role=True)

    @pytest.fixture
    def cleanup_user(self, test_client):
        """Cleanup fixture for user tests"""
        created_users = []

        yield created_users

        # Cleanup after test
        for user_id in created_users:
            test_client.cleanup_test_data('users', {'id': user_id})

    def test_create_instructor_user(self, test_client, cleanup_user):
        """Test creating an instructor user"""
        email = f"test_instructor_{uuid.uuid4()}@example.com"
        user = test_client.create_test_user(
            email=email,
            name="Test Instructor",
            user_type="instructor",
            username=f"instructor_{uuid.uuid4().hex[:8]}"
        )

        assert user is not None
        assert user['email'] == email
        assert user['user_type'] == 'instructor'
        assert user['username'] is not None
        cleanup_user.append(user['id'])

    def test_create_student_user(self, test_client, cleanup_user):
        """Test creating a student user"""
        email = f"test_student_{uuid.uuid4()}@example.com"
        user = test_client.create_test_user(
            email=email,
            name="Test Student",
            user_type="student"
        )

        assert user is not None
        assert user['email'] == email
        assert user['user_type'] == 'student'
        cleanup_user.append(user['id'])

    def test_user_email_uniqueness(self, test_client, cleanup_user):
        """Test that user emails must be unique"""
        email = f"unique_test_{uuid.uuid4()}@example.com"

        user1 = test_client.create_test_user(
            email=email,
            name="First User",
            user_type="student"
        )
        assert user1 is not None
        cleanup_user.append(user1['id'])

        # Try to create duplicate
        user2 = test_client.create_test_user(
            email=email,
            name="Second User",
            user_type="student"
        )
        assert user2 is None  # Should fail

    def test_get_user_by_email(self, test_client, cleanup_user):
        """Test retrieving user by email"""
        email = f"get_test_{uuid.uuid4()}@example.com"
        created_user = test_client.create_test_user(
            email=email,
            name="Get Test User",
            user_type="instructor"
        )
        cleanup_user.append(created_user['id'])

        retrieved_user = test_client.get_user_by_email(email)
        assert retrieved_user is not None
        assert retrieved_user['email'] == email
        assert retrieved_user['id'] == created_user['id']

    def test_update_user_profile(self, test_client, cleanup_user):
        """Test updating user profile"""
        user = test_client.create_test_user(
            email=f"update_test_{uuid.uuid4()}@example.com",
            name="Original Name",
            user_type="instructor"
        )
        cleanup_user.append(user['id'])

        # Update bio
        result = test_client.client.table('users').update({
            'bio': 'Updated bio text'
        }).eq('id', user['id']).execute()

        assert result.data[0]['bio'] == 'Updated bio text'


class TestCoachingOperations:
    """Test coaching table CRUD operations"""

    @pytest.fixture
    def test_client(self):
        return get_test_client(use_service_role=True)

    @pytest.fixture
    def test_instructor(self, test_client):
        """Create a test instructor"""
        user = test_client.create_test_user(
            email=f"coach_test_{uuid.uuid4()}@example.com",
            name="Coach Test",
            user_type="instructor"
        )
        yield user
        test_client.cleanup_test_data('users', {'id': user['id']})

    def test_create_private_coaching(self, test_client, test_instructor):
        """Test creating a private coaching"""
        coaching = test_client.create_test_coaching(
            instructor_id=test_instructor['id'],
            title="Private Lesson",
            duration=60,
            price=50000,
            coaching_type='private'
        )

        assert coaching is not None
        assert coaching['title'] == "Private Lesson"
        assert coaching['type'] == 'private'
        assert coaching['duration'] == 60
        assert coaching['is_active'] is True

        # Cleanup
        test_client.cleanup_test_data('coachings', {'id': coaching['id']})

    def test_create_group_coaching(self, test_client, test_instructor):
        """Test creating a group coaching"""
        coaching = test_client.create_test_coaching(
            instructor_id=test_instructor['id'],
            title="Group Class",
            duration=90,
            price=30000,
            coaching_type='group'
        )

        assert coaching is not None
        assert coaching['type'] == 'group'

        # Cleanup
        test_client.cleanup_test_data('coachings', {'id': coaching['id']})

    def test_list_active_coachings(self, test_client, test_instructor):
        """Test listing active coachings"""
        # Create multiple coachings
        coaching1 = test_client.create_test_coaching(
            test_instructor['id'], "Coaching 1"
        )
        coaching2 = test_client.create_test_coaching(
            test_instructor['id'], "Coaching 2"
        )

        # Query active coachings
        result = test_client.client.table('coachings').select('*').eq(
            'instructor_id', test_instructor['id']
        ).eq('is_active', True).execute()

        assert len(result.data) >= 2

        # Cleanup
        test_client.cleanup_test_data('coachings', {'id': coaching1['id']})
        test_client.cleanup_test_data('coachings', {'id': coaching2['id']})

    def test_deactivate_coaching(self, test_client, test_instructor):
        """Test deactivating a coaching"""
        coaching = test_client.create_test_coaching(
            test_instructor['id'], "To Deactivate"
        )

        # Deactivate
        result = test_client.client.table('coachings').update({
            'is_active': False
        }).eq('id', coaching['id']).execute()

        assert result.data[0]['is_active'] is False

        # Cleanup
        test_client.cleanup_test_data('coachings', {'id': coaching['id']})


class TestPackageOperations:
    """Test package table CRUD operations"""

    @pytest.fixture
    def test_setup(self, request):
        """Setup test users and coaching"""
        client = get_test_client(use_service_role=True)

        instructor = client.create_test_user(
            f"pkg_instructor_{uuid.uuid4()}@example.com",
            "Package Instructor",
            "instructor"
        )

        student = client.create_test_user(
            f"pkg_student_{uuid.uuid4()}@example.com",
            "Package Student",
            "student"
        )

        coaching = client.create_test_coaching(
            instructor['id'],
            "Package Coaching"
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

    def test_create_package(self, test_setup):
        """Test creating a package"""
        client = test_setup['client']
        package = client.create_test_package(
            student_id=test_setup['student']['id'],
            instructor_id=test_setup['instructor']['id'],
            coaching_id=test_setup['coaching']['id'],
            total_sessions=10,
            expires_in_days=90
        )

        assert package is not None
        assert package['total_sessions'] == 10
        assert package['remaining_sessions'] == 10

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})

    def test_package_session_deduction(self, test_setup):
        """Test deducting sessions from a package"""
        client = test_setup['client']
        package = client.create_test_package(
            test_setup['student']['id'],
            test_setup['instructor']['id'],
            test_setup['coaching']['id']
        )

        # Deduct session
        result = client.client.table('packages').update({
            'remaining_sessions': package['remaining_sessions'] - 1
        }).eq('id', package['id']).execute()

        assert result.data[0]['remaining_sessions'] == package['remaining_sessions'] - 1

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})

    def test_expired_package_detection(self, test_setup):
        """Test detecting expired packages"""
        client = test_setup['client']

        # Create expired package
        past_date = (datetime.now() - timedelta(days=1)).isoformat()
        package_data = {
            'student_id': test_setup['student']['id'],
            'instructor_id': test_setup['instructor']['id'],
            'coaching_id': test_setup['coaching']['id'],
            'total_sessions': 10,
            'remaining_sessions': 5,
            'expires_at': past_date
        }

        result = client.client.table('packages').insert(package_data).execute()
        package = result.data[0]

        # Query expired packages
        expired_result = client.client.table('packages').select('*').lt(
            'expires_at', datetime.now().isoformat()
        ).execute()

        expired_ids = [p['id'] for p in expired_result.data]
        assert package['id'] in expired_ids

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})

    def test_package_without_sessions(self, test_setup):
        """Test package with zero remaining sessions"""
        client = test_setup['client']
        package_data = {
            'student_id': test_setup['student']['id'],
            'instructor_id': test_setup['instructor']['id'],
            'coaching_id': test_setup['coaching']['id'],
            'total_sessions': 10,
            'remaining_sessions': 0,
            'expires_at': (datetime.now() + timedelta(days=90)).isoformat()
        }

        result = client.client.table('packages').insert(package_data).execute()
        package = result.data[0]

        assert package['remaining_sessions'] == 0

        # Cleanup
        client.cleanup_test_data('packages', {'id': package['id']})


class TestReservationOperations:
    """Test reservation table CRUD operations"""

    @pytest.fixture
    def full_test_setup(self):
        """Setup complete test environment with users, coaching, and package"""
        client = get_test_client(use_service_role=True)

        instructor = client.create_test_user(
            f"res_instructor_{uuid.uuid4()}@example.com",
            "Reservation Instructor",
            "instructor"
        )

        student = client.create_test_user(
            f"res_student_{uuid.uuid4()}@example.com",
            "Reservation Student",
            "student"
        )

        coaching = client.create_test_coaching(
            instructor['id'],
            "Reservation Coaching"
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

    def test_create_reservation(self, full_test_setup):
        """Test creating a reservation"""
        client = full_test_setup['client']
        start_time = (datetime.now() + timedelta(days=1)).replace(
            hour=10, minute=0, second=0, microsecond=0
        ).isoformat()

        reservation = client.create_test_reservation(
            student_id=full_test_setup['student']['id'],
            instructor_id=full_test_setup['instructor']['id'],
            coaching_id=full_test_setup['coaching']['id'],
            package_id=full_test_setup['package']['id'],
            start_time=start_time,
            duration=60
        )

        assert reservation is not None
        assert reservation['status'] == 'confirmed'

        # Cleanup
        client.cleanup_test_data('reservations', {'id': reservation['id']})

    def test_reservation_conflict_detection(self, full_test_setup):
        """Test detecting overlapping reservations"""
        client = full_test_setup['client']
        start_time = (datetime.now() + timedelta(days=2)).replace(
            hour=14, minute=0, second=0, microsecond=0
        ).isoformat()

        # Create first reservation
        res1 = client.create_test_reservation(
            full_test_setup['student']['id'],
            full_test_setup['instructor']['id'],
            full_test_setup['coaching']['id'],
            full_test_setup['package']['id'],
            start_time,
            60
        )

        # Query overlapping reservations
        end_time = (datetime.fromisoformat(start_time) + timedelta(minutes=60)).isoformat()

        result = client.client.table('reservations').select('*').eq(
            'instructor_id', full_test_setup['instructor']['id']
        ).gte('start_time', start_time).lte('end_time', end_time).execute()

        assert len(result.data) > 0

        # Cleanup
        client.cleanup_test_data('reservations', {'id': res1['id']})

    def test_cancel_reservation(self, full_test_setup):
        """Test cancelling a reservation"""
        client = full_test_setup['client']
        start_time = (datetime.now() + timedelta(days=3)).replace(
            hour=11, minute=0, second=0, microsecond=0
        ).isoformat()

        reservation = client.create_test_reservation(
            full_test_setup['student']['id'],
            full_test_setup['instructor']['id'],
            full_test_setup['coaching']['id'],
            full_test_setup['package']['id'],
            start_time
        )

        # Cancel reservation
        result = client.client.table('reservations').update({
            'status': 'cancelled'
        }).eq('id', reservation['id']).execute()

        assert result.data[0]['status'] == 'cancelled'

        # Cleanup
        client.cleanup_test_data('reservations', {'id': reservation['id']})

    def test_get_student_reservations(self, full_test_setup):
        """Test retrieving student's reservations"""
        client = full_test_setup['client']
        start_time = (datetime.now() + timedelta(days=4)).replace(
            hour=15, minute=0, second=0, microsecond=0
        ).isoformat()

        reservation = client.create_test_reservation(
            full_test_setup['student']['id'],
            full_test_setup['instructor']['id'],
            full_test_setup['coaching']['id'],
            full_test_setup['package']['id'],
            start_time
        )

        # Get student's reservations
        result = client.client.table('reservations').select('*').eq(
            'student_id', full_test_setup['student']['id']
        ).execute()

        assert len(result.data) > 0
        assert any(r['id'] == reservation['id'] for r in result.data)

        # Cleanup
        client.cleanup_test_data('reservations', {'id': reservation['id']})

    def test_reservation_with_meet_link(self, full_test_setup):
        """Test reservation with Google Meet link"""
        client = full_test_setup['client']
        start_time = (datetime.now() + timedelta(days=5)).replace(
            hour=16, minute=0, second=0, microsecond=0
        ).isoformat()

        start = datetime.fromisoformat(start_time)
        end = start + timedelta(minutes=60)

        reservation_data = {
            'student_id': full_test_setup['student']['id'],
            'instructor_id': full_test_setup['instructor']['id'],
            'coaching_id': full_test_setup['coaching']['id'],
            'package_id': full_test_setup['package']['id'],
            'start_time': start.isoformat(),
            'end_time': end.isoformat(),
            'status': 'confirmed',
            'meet_link': 'https://meet.google.com/test-link-123'
        }

        result = client.client.table('reservations').insert(reservation_data).execute()
        reservation = result.data[0]

        assert reservation['meet_link'] == 'https://meet.google.com/test-link-123'

        # Cleanup
        client.cleanup_test_data('reservations', {'id': reservation['id']})


class TestInstructorSettings:
    """Test instructor settings operations"""

    @pytest.fixture
    def test_instructor(self):
        """Create test instructor"""
        client = get_test_client(use_service_role=True)
        instructor = client.create_test_user(
            f"settings_instructor_{uuid.uuid4()}@example.com",
            "Settings Instructor",
            "instructor"
        )
        yield {'client': client, 'instructor': instructor}
        client.cleanup_test_data('users', {'id': instructor['id']})

    def test_create_instructor_settings(self, test_instructor):
        """Test creating instructor settings"""
        client = test_instructor['client']
        settings = TestDataGenerator.generate_instructor_settings(
            test_instructor['instructor']['id']
        )

        result = client.client.table('settings').insert(settings).execute()
        created_settings = result.data[0]

        assert created_settings['instructor_id'] == test_instructor['instructor']['id']
        assert created_settings['timezone'] == 'Asia/Seoul'

        # Cleanup
        client.cleanup_test_data('settings', {'id': created_settings['id']})

    def test_update_business_hours(self, test_instructor):
        """Test updating business hours"""
        client = test_instructor['client']
        settings = TestDataGenerator.generate_instructor_settings(
            test_instructor['instructor']['id']
        )

        result = client.client.table('settings').insert(settings).execute()
        created_settings = result.data[0]

        # Update business hours
        import json
        new_hours = TestDataGenerator.generate_business_hours()
        new_hours['saturday'] = [{"start": "10:00", "end": "14:00"}]

        update_result = client.client.table('settings').update({
            'business_hours': json.dumps(new_hours)
        }).eq('id', created_settings['id']).execute()

        updated = update_result.data[0]
        updated_hours = json.loads(updated['business_hours'])
        assert len(updated_hours['saturday']) == 1

        # Cleanup
        client.cleanup_test_data('settings', {'id': created_settings['id']})


class TestGroupClasses:
    """Test group classes operations"""

    @pytest.fixture
    def test_instructor(self):
        """Create test instructor"""
        client = get_test_client(use_service_role=True)
        instructor = client.create_test_user(
            f"group_instructor_{uuid.uuid4()}@example.com",
            "Group Instructor",
            "instructor"
        )
        yield {'client': client, 'instructor': instructor}
        client.cleanup_test_data('users', {'id': instructor['id']})

    def test_create_group_class(self, test_instructor):
        """Test creating a group class"""
        client = test_instructor['client']
        tomorrow = datetime.now() + timedelta(days=1)

        class_data = {
            'instructor_id': test_instructor['instructor']['id'],
            'title': 'Morning Yoga',
            'date': tomorrow.date().isoformat(),
            'time': '09:00:00',
            'type': 'group',
            'max_capacity': 10,
            'current_count': 0,
            'status': 'scheduled'
        }

        result = client.client.table('group_classes').insert(class_data).execute()
        group_class = result.data[0]

        assert group_class['title'] == 'Morning Yoga'
        assert group_class['max_capacity'] == 10

        # Cleanup
        client.cleanup_test_data('group_classes', {'id': group_class['id']})

    def test_group_class_capacity_check(self, test_instructor):
        """Test checking group class capacity"""
        client = test_instructor['client']
        tomorrow = datetime.now() + timedelta(days=1)

        class_data = {
            'instructor_id': test_instructor['instructor']['id'],
            'title': 'Evening Pilates',
            'date': tomorrow.date().isoformat(),
            'time': '18:00:00',
            'type': 'group',
            'max_capacity': 5,
            'current_count': 4,
            'status': 'scheduled'
        }

        result = client.client.table('group_classes').insert(class_data).execute()
        group_class = result.data[0]

        # Check if class is almost full
        remaining_spots = group_class['max_capacity'] - group_class['current_count']
        assert remaining_spots == 1

        # Cleanup
        client.cleanup_test_data('group_classes', {'id': group_class['id']})

    def test_increment_class_count(self, test_instructor):
        """Test incrementing current count when student joins"""
        client = test_instructor['client']
        tomorrow = datetime.now() + timedelta(days=1)

        class_data = {
            'instructor_id': test_instructor['instructor']['id'],
            'title': 'Afternoon Stretch',
            'date': tomorrow.date().isoformat(),
            'time': '14:00:00',
            'type': 'group',
            'max_capacity': 8,
            'current_count': 3,
            'status': 'scheduled'
        }

        result = client.client.table('group_classes').insert(class_data).execute()
        group_class = result.data[0]

        # Student joins
        update_result = client.client.table('group_classes').update({
            'current_count': group_class['current_count'] + 1
        }).eq('id', group_class['id']).execute()

        assert update_result.data[0]['current_count'] == 4

        # Cleanup
        client.cleanup_test_data('group_classes', {'id': group_class['id']})


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
