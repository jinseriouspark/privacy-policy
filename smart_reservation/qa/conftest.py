"""
Pytest configuration and shared fixtures
This file is automatically loaded by pytest
"""
import pytest
import os
from datetime import datetime
from pathlib import Path


def pytest_configure(config):
    """Configure pytest with custom settings"""
    # Create reports directory if it doesn't exist
    reports_dir = Path(__file__).parent / 'reports'
    reports_dir.mkdir(exist_ok=True)

    # Create screenshots directory
    screenshots_dir = Path(__file__).parent / 'screenshots'
    screenshots_dir.mkdir(exist_ok=True)

    # Create coverage directory
    coverage_dir = Path(__file__).parent / 'coverage'
    coverage_dir.mkdir(exist_ok=True)


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically"""
    for item in items:
        # Add markers based on file name
        if "test_api" in str(item.fspath):
            item.add_marker(pytest.mark.api)
            item.add_marker(pytest.mark.database)
        elif "test_ui" in str(item.fspath):
            item.add_marker(pytest.mark.ui)
            item.add_marker(pytest.mark.integration)
        elif "test_scenarios" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
            item.add_marker(pytest.mark.regression)

        # Mark tests with "workflow" in name as slow
        if "workflow" in item.name or "complete" in item.name:
            item.add_marker(pytest.mark.slow)


@pytest.fixture(scope="session")
def test_timestamp():
    """Timestamp for the test session"""
    return datetime.now().strftime("%Y%m%d_%H%M%S")


@pytest.fixture(scope="session")
def reports_dir():
    """Path to reports directory"""
    return Path(__file__).parent / 'reports'


@pytest.fixture(scope="session")
def screenshots_dir():
    """Path to screenshots directory"""
    return Path(__file__).parent / 'screenshots'


@pytest.fixture(autouse=True)
def screenshot_on_failure(request, page=None):
    """Automatically take screenshot on test failure (for UI tests)"""
    yield

    if request.node.rep_call.failed if hasattr(request.node, 'rep_call') else False:
        if page is not None:
            try:
                screenshots_dir = Path(__file__).parent / 'screenshots'
                screenshot_path = screenshots_dir / f"{request.node.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                page.screenshot(path=str(screenshot_path))
                print(f"\nScreenshot saved: {screenshot_path}")
            except Exception as e:
                print(f"\nFailed to capture screenshot: {e}")


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to make test result available to fixtures"""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)


@pytest.fixture(scope="function")
def test_context():
    """Provide test context information"""
    return {
        'start_time': datetime.now(),
        'test_data': {}
    }


# Playwright-specific fixtures
@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    """Configure browser launch arguments"""
    return {
        **browser_type_launch_args,
        "headless": os.getenv("HEADLESS_MODE", "true").lower() == "true",
        "slow_mo": int(os.getenv("SLOW_MO", "0")),
    }


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Configure browser context"""
    return {
        **browser_context_args,
        "viewport": {"width": 1280, "height": 720},
        "locale": "ko-KR",
        "timezone_id": "Asia/Seoul",
        "permissions": ["geolocation"],
        "record_video_dir": str(Path(__file__).parent / "videos") if os.getenv("RECORD_VIDEO") else None,
    }


# Custom markers for better test organization
def pytest_addoption(parser):
    """Add custom command line options"""
    parser.addoption(
        "--skip-slow",
        action="store_true",
        default=False,
        help="Skip slow tests"
    )
    parser.addoption(
        "--smoke-only",
        action="store_true",
        default=False,
        help="Run only smoke tests"
    )


def pytest_collection_modifyitems_with_options(config, items):
    """Modify test collection based on custom options"""
    if config.getoption("--skip-slow"):
        skip_slow = pytest.mark.skip(reason="Skipping slow tests (--skip-slow)")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_slow)

    if config.getoption("--smoke-only"):
        skip_non_smoke = pytest.mark.skip(reason="Running smoke tests only (--smoke-only)")
        for item in items:
            if "smoke" not in item.keywords:
                item.add_marker(skip_non_smoke)


# Helper function for test data cleanup
@pytest.fixture
def cleanup_tracker():
    """Track resources to clean up after test"""
    resources = {
        'users': [],
        'coachings': [],
        'packages': [],
        'reservations': [],
        'settings': [],
        'group_classes': []
    }

    yield resources

    # Cleanup logic would go here
    # This is handled by individual test fixtures
    # but this provides a central tracking mechanism


# Performance tracking
@pytest.fixture(autouse=True)
def track_performance(request):
    """Track test execution time"""
    start = datetime.now()
    yield
    duration = (datetime.now() - start).total_seconds()

    # Log slow tests
    if duration > 5.0:
        print(f"\n⚠️  Slow test: {request.node.name} took {duration:.2f}s")
