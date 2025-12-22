#!/bin/bash

# Quick Start Script for Yeyak-mania QA Suite
# Sets up the test environment and runs a sample test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Yeyak-mania QA Quick Start"
echo "=============================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version

# Create virtual environment
if [ ! -d "${SCRIPT_DIR}/venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv "${SCRIPT_DIR}/venv"
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source "${SCRIPT_DIR}/venv/bin/activate"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r "${SCRIPT_DIR}/requirements.txt"
echo "✓ Dependencies installed"

# Install Playwright
echo ""
echo "Installing Playwright browsers..."
playwright install chromium
echo "✓ Playwright installed"

# Check .env file
echo ""
if [ ! -f "${SCRIPT_DIR}/../.env" ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo ""
    echo "Please create a .env file in the project root with:"
    echo "  VITE_SUPABASE_URL=your_supabase_url"
    echo "  VITE_SUPABASE_ANON_KEY=your_anon_key"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
    echo "See .env.example for reference."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ .env file found"
fi

# Run a sample test
echo ""
echo "Running sample test..."
echo "=============================="
echo ""

# Run just the database connectivity test as a smoke test
pytest -v "${SCRIPT_DIR}/test_api.py::TestDatabaseConnectivity::test_supabase_connection" --tb=short

echo ""
echo "=============================="
echo "✓ Quick start complete!"
echo ""
echo "Next steps:"
echo "  1. Run all tests: ./run_tests.sh"
echo "  2. Run specific tests: ./run_tests.sh --api-only"
echo "  3. View test options: ./run_tests.sh --help"
echo "  4. Read documentation: cat README.md"
echo ""
echo "Happy testing! 🎉"
