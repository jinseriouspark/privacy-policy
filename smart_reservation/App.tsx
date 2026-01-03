import React, { useState, useEffect } from 'react';
import { User, Instructor, UserType } from './types';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import { Dashboard } from './components/Dashboard';
import { MobileDashboard } from './components/mobile/MobileDashboard';
import Reservation from './components/Reservation';
import InstructorProfile from './components/InstructorProfile';
import StudioSetup from './components/StudioSetup';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AccountTypeSelection from './components/AccountTypeSelection';
import ErrorBoundary from './components/ErrorBoundary';
import PublicBooking from './components/PublicBooking';
import OAuthCallback from './components/OAuthCallback';
import { getCurrentProjectSlug, getBookingUrlParams, getStudioSlug } from './services/api';
import { supabase } from './lib/supabase/client';
import { getUserByEmail, upsertUser, acceptInvitation, getCoachingBySlug, getCoachingByCoachAndSlug, selectUserType, getInstructorCoachings } from './lib/supabase/database';
import { verifyToken } from './lib/jwt';
import { navigateTo, replaceTo, getCurrentRoute, getPostLoginRoute, ROUTES } from './utils/router';
import { initGA, trackPageView, analytics } from './lib/analytics';
import { useIsMobile } from './hooks/useIsMobile';
import { Toaster } from 'react-hot-toast';

// 앱 버전 - 변경 시 모든 캐시 무효화
const APP_VERSION = '1.0.6';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentInstructor, setCurrentInstructor] = useState<Instructor | null>(null);
  const [checking, setChecking] = useState(false); // 🆕 인증 체크 중 상태

  // Mobile detection (480px = smartphone only, not tablets)
  const isMobile = useIsMobile(480);

  // URL 상태 추적
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // 버전 체크 및 캐시 강제 갱신
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion !== APP_VERSION) {
      console.log(`[App] Version updated: ${storedVersion} → ${APP_VERSION}`);
      console.log('[App] Clearing cache and reloading...');
      localStorage.setItem('app_version', APP_VERSION);

      // Service Worker 캐시 제거
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }

      // 브라우저 캐시 강제 갱신
      window.location.reload();
    }
  }, []);

  // Initialize Google Analytics
  useEffect(() => {
    initGA();
  }, []);

  // Listen for URL changes
  useEffect(() => {
    // Handle Notion OAuth callback
    const params = new URLSearchParams(window.location.search);
    const notionCode = params.get('code');
    const notionState = params.get('state');

    if (notionCode && window.location.pathname === '/notion-callback') {
      handleNotionCallback(notionCode);
      return;
    }

    // 🆕 Handle demo mode (?demo=true)
    const isDemoMode = params.get('demo') === 'true';
    if (isDemoMode && !currentUser) {
      handleDemoLogin();
      return;
    }

    // Remove hash from URL (Supabase auth uses hash fragments)
    if (window.location.hash && window.location.hash.includes('access_token')) {
      // Let Supabase handle auth, then clean up
      setTimeout(() => {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState({}, '', cleanUrl);
      }, 100);
    } else if (window.location.hash) {
      // Remove any other hash
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState({}, '', cleanUrl);
    }

    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname);
      trackPageView(window.location.pathname);
    };

    // Track initial page view
    trackPageView(window.location.pathname);

    // Listen to browser back/forward
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('navigate', handleUrlChange as EventListener);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('navigate', handleUrlChange as EventListener);
    };
  }, []);

  // Check session and handle routing
  useEffect(() => {
    checkSessionAndRoute();
  }, [currentPath]);

  const checkSessionAndRoute = async () => {
    try {
      setChecking(true); // 🆕 체크 시작
      const path = window.location.pathname;
      const route = getCurrentRoute();

      // Public routes (no auth required)
      if (path === ROUTES.PRIVACY || path === ROUTES.TERMS) {
        setLoading(false);
        setChecking(false);
        return;
      }

      // App routes (skip instructor data loading)
      const appRoutes = [
        ROUTES.LANDING, ROUTES.LOGIN, ROUTES.ONBOARDING, ROUTES.SETUP,
        ROUTES.DASHBOARD, ROUTES.SUMMARY, ROUTES.RESERVATIONS, ROUTES.STUDENTS,
        ROUTES.ATTENDANCE, ROUTES.PACKAGES, ROUTES.PROFILE,
        ROUTES.STUDENT_HOME, ROUTES.STUDENT_CALENDAR, ROUTES.STUDENT_RESERVATIONS, ROUTES.STUDENT_PROFILE
      ];

      // Get booking URL params (needed for both instructor loading and guest user handling)
      const coachingSlug = getCurrentProjectSlug();
      const { coachId, classSlug, studioSlug } = getBookingUrlParams();

      // Only load instructor data for booking routes (not app routes)
      if (!appRoutes.includes(path)) {
        // Fetch instructor data for booking pages
        await loadInstructorData(coachingSlug, coachId, classSlug, studioSlug, route.params.coach);
      }

      // Check JWT token
      const token = localStorage.getItem('auth_token');

      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          await handleAuthenticatedUser(payload.email, route);
        } else {
          // Invalid token, clear it
          localStorage.removeItem('auth_token');
          await handleGuestUser(path, coachingSlug, coachId, classSlug, route.params.invite);
        }
      } else {
        await handleGuestUser(path, coachingSlug, coachId, classSlug, route.params.invite);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
      setChecking(false); // 🆕 체크 완료
    }
  };

  const loadInstructorData = async (
    coachingSlug: string | null,
    coachId: string | null,
    classSlug: string | null,
    studioSlug: string | null,
    coachEmail: string | undefined
  ) => {
    try {
      // New format: /book/{studioSlug}
      if (studioSlug && !coachingSlug) {
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('username', studioSlug)
          .single();

        if (users) {
          setCurrentInstructor({
            id: users.id,
            name: users.name,
            bio: users.bio || 'Professional Coach',
            avatarUrl: users.picture || ''
          });
        }
      } else if (coachEmail && !coachingSlug) {
        const instructor = await getUserByEmail(coachEmail);
        if (instructor) {
          setCurrentInstructor({
            id: instructor.id,
            name: instructor.name,
            bio: instructor.bio || 'Professional Coach',
            avatarUrl: instructor.picture || ''
          });
        }
      } else if (coachId && classSlug) {
        const coaching = await getCoachingByCoachAndSlug(coachId, classSlug);
        if (coaching?.instructor) {
          setCurrentInstructor({
            id: coaching.instructor.id,
            name: coaching.instructor.name,
            bio: coaching.instructor.bio || 'Professional Coach',
            avatarUrl: coaching.instructor.picture || ''
          });
        }
      } else if (coachingSlug) {
        const coaching = await getCoachingBySlug(coachingSlug);
        if (coaching?.instructor) {
          setCurrentInstructor({
            id: coaching.instructor.id,
            name: coaching.instructor.name,
            bio: coaching.instructor.bio || 'Professional Coach',
            avatarUrl: coaching.instructor.picture || ''
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch instructor:', e);
    }
  };

  const handleAuthenticatedUser = async (email: string, route: any) => {
    console.log('[handleAuthenticatedUser] START', { email, currentPath: window.location.pathname });

    // 🆕 이미 currentUser가 설정되어 있고 onboarding이나 setup 페이지에 있다면 스킵
    // (handleSelectUserType에서 방금 역할을 선택한 직후)
    if (currentUser && currentUser.email === email) {
      const path = window.location.pathname;
      if (path === ROUTES.ONBOARDING || path === ROUTES.SETUP ||
          path === ROUTES.SUMMARY || path === ROUTES.STUDENT_HOME) {
        console.log('[handleAuthenticatedUser] User already set, skipping re-check on:', path);
        return;
      }
    }

    let existingUser = await getUserByEmail(email);
    console.log('[handleAuthenticatedUser] existingUser:', existingUser);

    // User doesn't exist - this shouldn't happen with our OAuth flow
    // (login.ts creates the user automatically)
    if (!existingUser) {
      console.error('[handleAuthenticatedUser] User not found in DB. This should not happen!');
      localStorage.removeItem('auth_token');
      navigateTo(ROUTES.LOGIN);
      return;
    }

    // Handle invitation acceptance
    if (route.params.invite) {
      try {
        await acceptInvitation(route.params.invite, existingUser.id, email);
        alert('강사와 연결되었습니다! 이제 예약이 가능합니다.');
        replaceTo(window.location.pathname);
      } catch (e: any) {
        console.error('Failed to accept invitation:', e);
        if (e.message) alert(e.message);
      }
    }

    // Get user role from user_roles table
    const primaryRole = existingUser.primaryRole; // 'instructor' or 'student'
    const hasRole = !!primaryRole;

    console.log('[handleAuthenticatedUser] primaryRole:', primaryRole, 'hasRole:', hasRole);

    const user: User = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      picture: existingUser.picture,
      userType: primaryRole === 'instructor' ? UserType.INSTRUCTOR : primaryRole === 'student' ? UserType.STUDENT : undefined,
      username: existingUser.username,
      bio: existingUser.bio,
      isProfileComplete: hasRole && (primaryRole === 'student' || !!existingUser.studio_name),
      remaining: 0
    };

    console.log('[handleAuthenticatedUser] Setting currentUser:', user);
    setCurrentUser(user);

    // 🆕 Check Supabase Auth session and create if missing
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.log('[handleAuthenticatedUser] No Supabase Auth session, checking if we can create one');

        // Try to get Supabase session from server
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
          try {
            const response = await fetch('/api/auth/refresh-supabase-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              }
            });

            if (response.ok) {
              const { supabaseSession } = await response.json();
              if (supabaseSession?.email && supabaseSession?.password) {
                console.log('[handleAuthenticatedUser] Creating Supabase Auth session...');
                const { error } = await supabase.auth.signInWithPassword({
                  email: supabaseSession.email,
                  password: supabaseSession.password,
                });
                if (error) {
                  console.error('[handleAuthenticatedUser] Supabase Auth login error:', error);
                } else {
                  console.log('[handleAuthenticatedUser] Supabase Auth session created successfully');
                }
              }
            }
          } catch (e) {
            console.error('[handleAuthenticatedUser] Failed to refresh Supabase session:', e);
          }
        }
      } else {
        console.log('[handleAuthenticatedUser] Supabase Auth session exists');
      }
    } catch (e) {
      console.error('[handleAuthenticatedUser] Error checking Supabase session:', e);
    }

    // Check if there's a saved redirect path (from requestCalendarPermissions)
    const savedRedirect = sessionStorage.getItem('postLoginRedirect');
    if (savedRedirect && window.location.pathname !== savedRedirect) {
      sessionStorage.removeItem('postLoginRedirect');
      console.log('[handleAuthenticatedUser] Redirecting to saved path:', savedRedirect);
      navigateTo(savedRedirect);
      return;
    }

    // If user hasn't selected type, redirect to onboarding
    if (!hasRole && window.location.pathname !== ROUTES.ONBOARDING) {
      console.log('[handleAuthenticatedUser] No role, redirecting to ONBOARDING');
      navigateTo(ROUTES.ONBOARDING);
      return;
    }

    // 🆕 If instructor with NO profile, redirect to setup
    if (primaryRole === 'instructor' && window.location.pathname !== ROUTES.SETUP) {
      // Only redirect to setup if studio_name is null
      if (!existingUser.studio_name) {
        console.log('[handleAuthenticatedUser] studio_name is null, redirecting to setup');
        navigateTo(ROUTES.SETUP);
        return;
      }

      // Log coachings count but don't block access
      try {
        const coachings = await getInstructorCoachings(existingUser.id);
        console.log('[handleAuthenticatedUser] Instructor has', coachings.length, 'coachings');
      } catch (e) {
        console.error('[handleAuthenticatedUser] Failed to check coachings:', e);
      }
    }

    // If on login page or landing, redirect to appropriate page
    if (window.location.pathname === ROUTES.LOGIN || window.location.pathname === ROUTES.LANDING) {
      const postLoginRoute = getPostLoginRoute(user);
      console.log('[handleAuthenticatedUser] On login/landing, redirecting to:', postLoginRoute);
      navigateTo(postLoginRoute);
    }
  };

  const handleGuestUser = async (
    path: string,
    coachingSlug: string | null,
    coachId: string | null,
    classSlug: string | null,
    inviteCode: string | undefined
  ) => {
    // Guest can access booking pages and public routes
    const isBookingPage = coachingSlug || (coachId && classSlug);
    const isPublicRoute = path === ROUTES.LANDING || path === ROUTES.LOGIN ||
                         path === ROUTES.PRIVACY || path === ROUTES.TERMS;

    // Redirect /home to login for guests
    if (path === ROUTES.STUDENT_HOME) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    if (!isBookingPage && !isPublicRoute && path !== '/') {
      // Redirect guests to landing
      navigateTo(ROUTES.LANDING);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    analytics.login('google');

    // Check if there's a saved redirect path (from requestCalendarPermissions)
    const savedRedirect = sessionStorage.getItem('postLoginRedirect');
    if (savedRedirect) {
      sessionStorage.removeItem('postLoginRedirect');
      navigateTo(savedRedirect);
      return;
    }

    // user_type이 없으면 onboarding으로
    if (!user.userType) {
      navigateTo(ROUTES.ONBOARDING);
    }
    // 강사이고 프로필 미완성 시 setup으로
    else if (user.userType === UserType.INSTRUCTOR && !user.isProfileComplete) {
      navigateTo(ROUTES.SETUP);
    } else {
      const postLoginRoute = getPostLoginRoute(user);
      navigateTo(postLoginRoute);
    }
  };

  const handleSelectUserType = async (userType: 'instructor' | 'student') => {
    console.log('[handleSelectUserType] START', { userType, currentUser });

    if (!currentUser) {
      console.error('[handleSelectUserType] No currentUser!');
      return;
    }

    try {
      setLoading(true);
      console.log('[handleSelectUserType] Calling selectUserType...');
      await selectUserType(currentUser.id!, userType);
      console.log('[handleSelectUserType] selectUserType SUCCESS');

      // DB에서 최신 사용자 정보 가져오기
      const updatedUser = await getUserByEmail(currentUser.email);
      console.log('[handleSelectUserType] Updated user from DB:', updatedUser);

      if (!updatedUser) {
        console.error('[handleSelectUserType] Failed to get updated user!');
        return;
      }

      // isProfileComplete 판단: 학생이면 항상 true, 강사면 studio_name 체크
      const isProfileComplete = userType === 'student' || !!updatedUser.studio_name;

      const user: User = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        picture: updatedUser.picture,
        userType: userType === 'instructor' ? UserType.INSTRUCTOR : UserType.STUDENT,
        username: updatedUser.username,
        bio: updatedUser.bio,
        isProfileComplete,
        remaining: 0
      };

      console.log('[handleSelectUserType] New user object:', user);
      setCurrentUser(user);
      analytics.selectAccountType(userType);

      // 직접 적절한 페이지로 이동 (무한 루프 방지)
      if (userType === 'instructor') {
        // 강사: studio_name이 없으면 setup, 있으면 summary
        if (!updatedUser.studio_name) {
          console.log('[handleSelectUserType] Instructor without studio, navigating to SETUP');
          navigateTo(ROUTES.SETUP);
        } else {
          console.log('[handleSelectUserType] Instructor with studio, navigating to SUMMARY');
          navigateTo(ROUTES.SUMMARY);
        }
      } else {
        // 학생: 홈으로
        console.log('[handleSelectUserType] Student, navigating to STUDENT_HOME');
        navigateTo(ROUTES.STUDENT_HOME);
      }
      console.log('[handleSelectUserType] END');
    } catch (error) {
      console.error('[handleSelectUserType] ERROR:', error);
      alert('계정 유형 선택에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      analytics.logout();
      // Clear JWT token
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
      navigateTo(ROUTES.LANDING);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNotionCallback = async (code: string) => {
    try {
      setLoading(true);
      const { handleNotionCallback: processCallback } = await import('./lib/notion-oauth');
      const result = await processCallback(code);

      if (result.success) {
        // Redirect to dashboard with success message
        navigateTo(ROUTES.DASHBOARD);
        setTimeout(() => {
          alert(`Notion 연동 완료: ${result.workspace_name}`);
        }, 500);
      }
    } catch (error) {
      console.error('Notion OAuth callback error:', error);
      navigateTo(ROUTES.DASHBOARD);
      setTimeout(() => {
        alert('Notion 연동에 실패했습니다.');
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      console.log('[handleDemoLogin] Starting demo login...');

      // Fetch demo user from database
      const demoUser = await getUserByEmail('demo@yeyakmania.com');

      if (!demoUser) {
        console.error('[handleDemoLogin] Demo user not found in database');
        alert('데모 계정을 찾을 수 없습니다. 데이터베이스를 확인해주세요.');
        navigateTo(ROUTES.LANDING);
        return;
      }

      console.log('[handleDemoLogin] Demo user found:', demoUser);

      // Create user object
      const user: User = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        picture: demoUser.picture,
        userType: UserType.INSTRUCTOR,
        username: demoUser.username,
        bio: demoUser.bio,
        isProfileComplete: true,
        remaining: 0
      };

      setCurrentUser(user);
      console.log('[handleDemoLogin] Demo user set, redirecting to dashboard');

      // Remove ?demo=true from URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      // Navigate to dashboard
      navigateTo(ROUTES.SUMMARY);
      analytics.login('demo');
    } catch (error) {
      console.error('[handleDemoLogin] Error:', error);
      alert('데모 로그인에 실패했습니다.');
      navigateTo(ROUTES.LANDING);
    } finally {
      setLoading(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const path = currentPath;
    const route = getCurrentRoute();

    // Route matching (순서 중요 - 구체적인 것부터)
    switch (path) {
      case ROUTES.LANDING:
        return (
          <LandingPage
            onLoginSuccess={handleLogin}
            onShowLogin={() => navigateTo(ROUTES.LOGIN)}
          />
        );

      case ROUTES.LOGIN:
        return <Login onLogin={handleLogin} />;

      case ROUTES.AUTH_CALLBACK:
        return <OAuthCallback />;

      case ROUTES.PRIVACY:
        return (
          <PrivacyPolicy
            onBack={() => {
              const backRoute = currentUser ? ROUTES.DASHBOARD : ROUTES.LANDING;
              navigateTo(backRoute);
            }}
          />
        );

      case ROUTES.TERMS:
        return (
          <TermsOfService
            onBack={() => {
              const backRoute = currentUser ? ROUTES.DASHBOARD : ROUTES.LANDING;
              navigateTo(backRoute);
            }}
          />
        );

      case ROUTES.ONBOARDING:
        return (
          <AccountTypeSelection
            onSelectType={handleSelectUserType}
            onBack={handleLogout}
            isLoading={loading}
          />
        );

      case ROUTES.SETUP:
        if (!currentUser) {
          navigateTo(ROUTES.LOGIN);
          return null;
        }
        return (
          <StudioSetup
            user={currentUser}
            onComplete={(updatedUser) => {
              setCurrentUser(updatedUser);
              navigateTo(ROUTES.SUMMARY);
            }}
          />
        );

      case ROUTES.DASHBOARD:
      case ROUTES.SUMMARY:
      case ROUTES.RESERVATIONS:
      case ROUTES.STUDENTS:
      case ROUTES.ATTENDANCE:
      case ROUTES.PACKAGES:
      case ROUTES.STUDENT_HOME:
      case ROUTES.STUDENT_CALENDAR:
      case ROUTES.STUDENT_RESERVATIONS:
      case ROUTES.STUDENT_PROFILE:
        if (!currentUser) {
          navigateTo(ROUTES.LOGIN);
          return null;
        }

        // Students (all screens): Use MobileDashboard
        if (currentUser.userType === UserType.STUDENT) {
          let initialTab: 'home' | 'calendar' | 'reservations' | 'students' | 'attendance' | 'more' | 'profile' = 'home';

          if (route.path === ROUTES.RESERVATIONS || route.path === ROUTES.STUDENT_RESERVATIONS) {
            initialTab = 'reservations';
          } else if (route.path === ROUTES.STUDENT_CALENDAR) {
            initialTab = 'calendar';
          } else if (route.path === ROUTES.STUDENT_PROFILE) {
            initialTab = 'profile';
          } else if (route.path === ROUTES.STUDENT_HOME) {
            initialTab = 'home';
          }

          return <MobileDashboard user={currentUser} initialTab={initialTab} />;
        }

        // Instructors only: Use Dashboard with hamburger menu
        return (
          <Dashboard
            user={currentUser}
            onNavigateToReservation={() => {}} // Not used in URL-based routing
            onNavigateToProfile={() => navigateTo(ROUTES.PROFILE)}
            onLogout={handleLogout}
          />
        );

      case ROUTES.PROFILE:
        if (!currentUser || currentUser.userType !== UserType.INSTRUCTOR) {
          navigateTo(ROUTES.DASHBOARD);
          return null;
        }
        return (
          <InstructorProfile
            user={currentUser}
            onUpdate={(updatedUser) => setCurrentUser(updatedUser)}
            onBack={() => navigateTo(ROUTES.DASHBOARD)}
            onLogout={handleLogout}
          />
        );

      default:
        // Dynamic routes: /{coach_id}/{class_slug} or /{class_slug}
        const coachingSlug = getCurrentProjectSlug();
        const { coachId, classSlug } = getBookingUrlParams();

        // Check for ?coach=email format
        if (route.params.coach && currentInstructor) {
          return (
            <PublicBooking
              instructor={currentInstructor}
              user={currentUser}
              onSelectCoaching={(slug) => {
                const bookingUrl = coachId ? `/${coachId}/${slug}` : `/${slug}`;
                navigateTo(bookingUrl);
              }}
              onBack={() => {
                const backRoute = currentUser ? ROUTES.DASHBOARD : ROUTES.LANDING;
                navigateTo(backRoute);
              }}
            />
          );
        }

        // Booking page
        if ((coachingSlug || (coachId && classSlug)) && currentInstructor) {
          return (
            <Reservation
              user={currentUser}
              instructor={currentInstructor}
              onBack={() => {
                const backRoute = currentUser ? ROUTES.DASHBOARD : ROUTES.LANDING;
                navigateTo(backRoute);
              }}
              onSuccess={() => {
                const successRoute = currentUser ? ROUTES.DASHBOARD : ROUTES.LANDING;
                navigateTo(successRoute);
              }}
            />
          );
        }

        // 404 - redirect to landing
        navigateTo(ROUTES.LANDING);
        return null;
    }
  };

  // Full-screen views without Layout
  const fullScreenPaths = [
    ROUTES.LANDING,
    ROUTES.AUTH_CALLBACK,
    ROUTES.DASHBOARD,
    ROUTES.SUMMARY,
    ROUTES.RESERVATIONS,
    ROUTES.STUDENTS,
    ROUTES.ATTENDANCE,
    ROUTES.PACKAGES,
    ROUTES.PROFILE,
    ROUTES.STUDENT_HOME,
    ROUTES.STUDENT_CALENDAR,
    ROUTES.STUDENT_RESERVATIONS,
    ROUTES.STUDENT_PROFILE,
    ROUTES.PRIVACY,
    ROUTES.TERMS,
    ROUTES.ONBOARDING
  ];

  const isFullScreen = fullScreenPaths.includes(currentPath);

  if (isFullScreen) {
    return (
      <ErrorBoundary>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {renderContent()}
      </ErrorBoundary>
    );
  }

  // Other views wrapped in Layout
  return (
    <ErrorBoundary>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Layout title="예약매니아">
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
