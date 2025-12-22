#!/bin/bash

# Yeyak-mania QA Test Suite Runner
# This script runs all tests and generates comprehensive reports

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${SCRIPT_DIR}/reports"
COVERAGE_DIR="${SCRIPT_DIR}/coverage"
SCREENSHOTS_DIR="${SCRIPT_DIR}/screenshots"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Yeyak-mania QA Test Suite Runner${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "${SCRIPT_DIR}/venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv "${SCRIPT_DIR}/venv"
    echo -e "${GREEN}Virtual environment created.${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "${SCRIPT_DIR}/venv/bin/activate"

# Install/update dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r "${SCRIPT_DIR}/requirements.txt"

# Install Playwright browsers if not already installed
if [ ! -d "${HOME}/Library/Caches/ms-playwright" ] && [ ! -d "${HOME}/.cache/ms-playwright" ]; then
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    playwright install chromium
fi

# Create reports directories
mkdir -p "${REPORTS_DIR}"
mkdir -p "${COVERAGE_DIR}"
mkdir -p "${SCREENSHOTS_DIR}"

# Check if .env file exists
if [ ! -f "${SCRIPT_DIR}/../.env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file in the project root with required variables.${NC}"
    echo "See .env.example for reference."
    exit 1
fi

# Parse command line arguments
RUN_API_TESTS=true
RUN_SCENARIO_TESTS=true
RUN_UI_TESTS=true
PARALLEL=false
VERBOSE=false
COVERAGE=false
HEADLESS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-only)
            RUN_SCENARIO_TESTS=false
            RUN_UI_TESTS=false
            shift
            ;;
        --scenarios-only)
            RUN_API_TESTS=false
            RUN_UI_TESTS=false
            shift
            ;;
        --ui-only)
            RUN_API_TESTS=false
            RUN_SCENARIO_TESTS=false
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --headed)
            HEADLESS=false
            shift
            ;;
        --help|-h)
            echo "Usage: ./run_tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --api-only        Run only API tests"
            echo "  --scenarios-only  Run only scenario tests"
            echo "  --ui-only         Run only UI tests"
            echo "  --parallel        Run tests in parallel"
            echo "  --verbose, -v     Verbose output"
            echo "  --coverage        Generate coverage report"
            echo "  --headed          Run UI tests in headed mode (visible browser)"
            echo "  --help, -h        Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build pytest command
PYTEST_CMD="pytest"
PYTEST_ARGS="-v"

if [ "$VERBOSE" = true ]; then
    PYTEST_ARGS="$PYTEST_ARGS -vv"
fi

if [ "$PARALLEL" = true ]; then
    PYTEST_ARGS="$PYTEST_ARGS -n auto"
fi

if [ "$COVERAGE" = true ]; then
    PYTEST_ARGS="$PYTEST_ARGS --cov=. --cov-report=html:${COVERAGE_DIR} --cov-report=term"
fi

# HTML Report
PYTEST_ARGS="$PYTEST_ARGS --html=${REPORTS_DIR}/test_report.html --self-contained-html"

# Screenshots directory for UI tests
export PYTEST_SCREENSHOT_DIR="${SCREENSHOTS_DIR}"

# Set headless mode
if [ "$HEADLESS" = true ]; then
    export HEADLESS_MODE="true"
else
    export HEADLESS_MODE="false"
fi

echo -e "${GREEN}Test Configuration:${NC}"
echo "  API Tests: ${RUN_API_TESTS}"
echo "  Scenario Tests: ${RUN_SCENARIO_TESTS}"
echo "  UI Tests: ${RUN_UI_TESTS}"
echo "  Parallel: ${PARALLEL}"
echo "  Coverage: ${COVERAGE}"
echo "  Headless: ${HEADLESS}"
echo ""

# Track test results
TEST_FAILED=false

# Run API Tests
if [ "$RUN_API_TESTS" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Running API Tests...${NC}"
    echo -e "${GREEN}========================================${NC}"
    if ! $PYTEST_CMD $PYTEST_ARGS "${SCRIPT_DIR}/test_api.py"; then
        TEST_FAILED=true
        echo -e "${RED}API tests failed!${NC}"
    else
        echo -e "${GREEN}API tests passed!${NC}"
    fi
    echo ""
fi

# Run Scenario Tests
if [ "$RUN_SCENARIO_TESTS" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Running Scenario Tests...${NC}"
    echo -e "${GREEN}========================================${NC}"
    if ! $PYTEST_CMD $PYTEST_ARGS "${SCRIPT_DIR}/test_scenarios.py"; then
        TEST_FAILED=true
        echo -e "${RED}Scenario tests failed!${NC}"
    else
        echo -e "${GREEN}Scenario tests passed!${NC}"
    fi
    echo ""
fi

# Run UI Tests
if [ "$RUN_UI_TESTS" = true ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Running UI Tests...${NC}"
    echo -e "${GREEN}========================================${NC}"
    if ! $PYTEST_CMD $PYTEST_ARGS "${SCRIPT_DIR}/test_ui.py"; then
        TEST_FAILED=true
        echo -e "${RED}UI tests failed!${NC}"
    else
        echo -e "${GREEN}UI tests passed!${NC}"
    fi
    echo ""
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Suite Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Reports generated:"
echo "  - HTML Report: ${REPORTS_DIR}/test_report.html"
if [ "$COVERAGE" = true ]; then
    echo "  - Coverage Report: ${COVERAGE_DIR}/index.html"
fi
if [ "$RUN_UI_TESTS" = true ]; then
    echo "  - Screenshots: ${SCREENSHOTS_DIR}"
fi
echo ""

# Open HTML report (optional - macOS only)
if command -v open &> /dev/null; then
    read -p "Open HTML report in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "${REPORTS_DIR}/test_report.html"
    fi
fi

# Exit with appropriate code
if [ "$TEST_FAILED" = true ]; then
    echo -e "${RED}Some tests failed. Check the reports for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
