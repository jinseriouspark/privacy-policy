"""
QA Test Configuration
Loads environment variables and provides test helpers
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, Dict, Any
import json

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class TestConfig:
    """Central configuration for all tests"""

    # Supabase Configuration
    SUPABASE_URL = os.getenv('VITE_SUPABASE_URL', '')
    SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY', '')
    SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

    # Google OAuth (for UI tests)
    GOOGLE_CLIENT_ID = os.getenv('VITE_GOOGLE_CLIENT_ID', '')

    # Application URLs
    APP_URL = os.getenv('APP_URL', 'https://yeyak-mania.vercel.app')

    # Test Users (create these in your test environment)
    TEST_INSTRUCTOR_EMAIL = os.getenv('TEST_INSTRUCTOR_EMAIL', 'test_instructor@example.com')
    TEST_STUDENT_EMAIL = os.getenv('TEST_STUDENT_EMAIL', 'test_student@example.com')

    # Test Configuration
    HEADLESS_MODE = os.getenv('HEADLESS_MODE', 'true').lower() == 'true'
    SLOW_MO = int(os.getenv('SLOW_MO', '0'))  # milliseconds
    SCREENSHOT_ON_FAILURE = True

    @classmethod
    def validate(cls):
        """Validate that required environment variables are set"""
        required_vars = {
            'VITE_SUPABASE_URL': cls.SUPABASE_URL,
            'VITE_SUPABASE_ANON_KEY': cls.SUPABASE_ANON_KEY,
        }

        missing = [key for key, value in required_vars.items() if not value]

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                "Please check your .env file"
            )

        return True


class SupabaseTestClient:
    """Helper class for Supabase operations in tests"""

    def __init__(self, use_service_role: bool = False):
        """
        Initialize Supabase client

        Args:
            use_service_role: If True, use service role key (bypasses RLS)
        """
        TestConfig.validate()

        key = (TestConfig.SUPABASE_SERVICE_ROLE_KEY if use_service_role
               else TestConfig.SUPABASE_ANON_KEY)

        self.client: Client = create_client(
            TestConfig.SUPABASE_URL,
            key
        )
        self.use_service_role = use_service_role

    def cleanup_test_data(self, table: str, filters: Dict[str, Any]) -> int:
        """
        Clean up test data from a table

        Args:
            table: Table name
            filters: Dictionary of column:value pairs for filtering

        Returns:
            Number of rows deleted
        """
        try:
            query = self.client.table(table).delete()

            for key, value in filters.items():
                query = query.eq(key, value)

            result = query.execute()
            return len(result.data) if result.data else 0
        except Exception as e:
            print(f"Error cleaning up {table}: {e}")
            return 0

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            result = self.client.table('users').select('*').eq('email', email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

    def create_test_user(self, email: str, name: str, user_type: str,
                         username: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Create a test user"""
        try:
            user_data = {
                'email': email,
                'name': name,
                'user_type': user_type,
                'username': username or email.split('@')[0]
            }

            result = self.client.table('users').insert(user_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    def create_test_coaching(self, instructor_id: str, title: str,
                            duration: int = 60, price: int = 50000,
                            coaching_type: str = 'private') -> Optional[Dict[str, Any]]:
        """Create a test coaching"""
        try:
            coaching_data = {
                'instructor_id': instructor_id,
                'title': title,
                'description': f'Test coaching: {title}',
                'duration': duration,
                'price': price,
                'type': coaching_type,
                'is_active': True
            }

            result = self.client.table('coachings').insert(coaching_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating coaching: {e}")
            return None

    def create_test_package(self, student_id: str, instructor_id: str,
                           coaching_id: str, total_sessions: int = 10,
                           expires_in_days: int = 90) -> Optional[Dict[str, Any]]:
        """Create a test package"""
        try:
            from datetime import datetime, timedelta

            package_data = {
                'student_id': student_id,
                'instructor_id': instructor_id,
                'coaching_id': coaching_id,
                'total_sessions': total_sessions,
                'remaining_sessions': total_sessions,
                'start_date': datetime.now().isoformat(),
                'expires_at': (datetime.now() + timedelta(days=expires_in_days)).isoformat()
            }

            result = self.client.table('packages').insert(package_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating package: {e}")
            return None

    def create_test_reservation(self, student_id: str, instructor_id: str,
                               coaching_id: str, package_id: str,
                               start_time: str, duration: int = 60) -> Optional[Dict[str, Any]]:
        """Create a test reservation"""
        try:
            from datetime import datetime, timedelta

            start = datetime.fromisoformat(start_time)
            end = start + timedelta(minutes=duration)

            reservation_data = {
                'student_id': student_id,
                'instructor_id': instructor_id,
                'coaching_id': coaching_id,
                'package_id': package_id,
                'start_time': start.isoformat(),
                'end_time': end.isoformat(),
                'status': 'confirmed'
            }

            result = self.client.table('reservations').insert(reservation_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating reservation: {e}")
            return None


class TestDataGenerator:
    """Generate realistic test data"""

    @staticmethod
    def generate_business_hours() -> Dict[str, Any]:
        """Generate sample business hours"""
        return {
            "monday": [{"start": "09:00", "end": "18:00"}],
            "tuesday": [{"start": "09:00", "end": "18:00"}],
            "wednesday": [{"start": "09:00", "end": "18:00"}],
            "thursday": [{"start": "09:00", "end": "18:00"}],
            "friday": [{"start": "09:00", "end": "18:00"}],
            "saturday": [],
            "sunday": []
        }

    @staticmethod
    def generate_instructor_settings(instructor_id: str,
                                     calendar_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate instructor settings"""
        return {
            'instructor_id': instructor_id,
            'calendar_id': calendar_id,
            'timezone': 'Asia/Seoul',
            'business_hours': json.dumps(TestDataGenerator.generate_business_hours()),
            'buffer_time': 15
        }


def get_test_client(use_service_role: bool = False) -> SupabaseTestClient:
    """
    Get a configured Supabase test client

    Args:
        use_service_role: If True, bypass RLS for admin operations

    Returns:
        SupabaseTestClient instance
    """
    return SupabaseTestClient(use_service_role=use_service_role)
