#!/usr/bin/env python3
"""
QA Test Suite for Coaching System
Tests the new coaching-based invitation and routing system
"""

import os
import sys

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {filepath}")
        return False

def check_file_content(filepath, search_strings, description):
    """Check if file contains required strings"""
    if not os.path.exists(filepath):
        print(f"❌ {description}: File not found - {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    missing = []
    for search_str in search_strings:
        if search_str not in content:
            missing.append(search_str)

    if missing:
        print(f"❌ {description}: Missing content in {filepath}")
        for m in missing:
            print(f"   - Missing: {m}")
        return False
    else:
        print(f"✅ {description}: {filepath}")
        return True

def main():
    print("=" * 60)
    print("🧪 QA Test Suite: Coaching System")
    print("=" * 60)
    print()

    base_path = "/Users/jinseulpark/Desktop/github/smart_reservation"
    os.chdir(base_path)

    results = []

    # Test 1: Check migration file
    print("📋 Test 1: Database Migration")
    results.append(check_file_exists(
        f"{base_path}/supabase/migrations/007_enhance_coaching_system.sql",
        "Migration file exists"
    ))
    results.append(check_file_content(
        f"{base_path}/supabase/migrations/007_enhance_coaching_system.sql",
        ["ALTER TABLE coaching ADD COLUMN", "slug TEXT UNIQUE", "coaching_id UUID"],
        "Migration contains coaching enhancements"
    ))
    print()

    # Test 2: Check types.ts
    print("📋 Test 2: TypeScript Types")
    results.append(check_file_content(
        f"{base_path}/types.ts",
        ["export interface Coaching", "slug: string", "google_calendar_id"],
        "Coaching interface defined"
    ))
    print()

    # Test 3: Check database.ts functions
    print("📋 Test 3: Database Functions")
    results.append(check_file_content(
        f"{base_path}/lib/supabase/database.ts",
        ["createCoaching", "getInstructorCoachings", "getCoachingBySlug", "createInvitation(coachingId"],
        "Coaching database functions exist"
    ))
    print()

    # Test 4: Check CoachingManagementModal
    print("📋 Test 4: Coaching Management Component")
    results.append(check_file_exists(
        f"{base_path}/components/CoachingManagementModal.tsx",
        "CoachingManagementModal component exists"
    ))
    results.append(check_file_content(
        f"{base_path}/components/CoachingManagementModal.tsx",
        ["CoachingManagementModal", "createCoaching", "getInstructorCoachings"],
        "CoachingManagementModal has correct imports"
    ))
    print()

    # Test 5: Check Dashboard integration
    print("📋 Test 5: Dashboard Integration")
    results.append(check_file_content(
        f"{base_path}/components/Dashboard.tsx",
        ["CoachingManagementModal", "currentCoaching", "showCoachingModal"],
        "Dashboard integrates coaching management"
    ))
    print()

    # Test 6: Check StudentInviteModal updates
    print("📋 Test 6: Student Invite Modal")
    results.append(check_file_content(
        f"{base_path}/components/StudentInviteModal.tsx",
        ["coachingId: string", "coachingSlug: string", "createInvitation(coachingId"],
        "StudentInviteModal uses coaching props"
    ))
    print()

    # Test 7: Check App.tsx routing
    print("📋 Test 7: App Routing")
    results.append(check_file_content(
        f"{base_path}/App.tsx",
        ["getCurrentProjectSlug", "getCoachingBySlug", "coachingSlug"],
        "App.tsx uses coaching-based routing"
    ))
    print()

    # Test 8: Check API service
    print("📋 Test 8: API Service")
    results.append(check_file_content(
        f"{base_path}/services/api.ts",
        ["getCurrentProjectSlug", "getProjectSlugFromUrl"],
        "API service has coaching routing helpers"
    ))
    print()

    # Summary
    print("=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    total = len(results)
    passed = sum(results)
    failed = total - passed

    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print()

    if failed == 0:
        print("🎉 All tests passed! System is ready.")
        return 0
    else:
        print(f"⚠️  {failed} test(s) failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
