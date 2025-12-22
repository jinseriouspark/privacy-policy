import React, { useState, useEffect } from 'react';
import { User, Instructor, ViewState, UserType } from './types';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import { Dashboard } from './components/Dashboard';
import Reservation from './components/Reservation';
import InstructorProfile from './components/InstructorProfile';
import StudioSetup from './components/StudioSetup';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AccountTypeSelection from './components/AccountTypeSelection';
import ErrorBoundary from './components/ErrorBoundary';
import { getCurrentProjectSlug } from './services/api';
import { AlertTriangle } from 'lucide-react';
import { signOut } from './lib/supabase/auth';
import { supabase } from './lib/supabase/client';
import { getUserByEmail, acceptInvitation, getInvitationByCode, getCoachingBySlug, selectUserType } from './lib/supabase/database';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANDING);
  const [loading, setLoading] = useState(true);
  const [currentInstructor, setCurrentInstructor] = useState<Instructor | null>(null);

  // URL에서 강사 프로젝트 슬러그 가져오기
  const coachingSlug = getCurrentProjectSlug();

  // Check session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for special routes first
        const path = window.location.pathname;
        if (path === '/privacy-policy') {
          setCurrentView(ViewState.PRIVACY);
          setLoading(false);
          return;
        }
        if (path === '/terms-of-service') {
          setCurrentView(ViewState.TERMS);
          setLoading(false);
          return;
        }

        // Check for invitation code and coach email in URL
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite');
        const coachEmail = urlParams.get('coach');

        // Fetch instructor data if needed (for both coach email and coaching slug)
        if (coachEmail && !coachingSlug) {
          try {
            const instructor = await getUserByEmail(coachEmail);
            if (instructor) {
              setCurrentInstructor({
                id: instructor.id,
                name: instructor.name,
                bio: instructor.bio || 'Professional Coach',
                avatarUrl: instructor.picture || ''
              });
            }
          } catch (e) {
            console.error('Failed to fetch instructor by email:', e);
          }
        } else if (coachingSlug) {
          try {
            const coaching = await getCoachingBySlug(coachingSlug);
            if (coaching && coaching.instructor) {
              setCurrentInstructor({
                id: coaching.instructor.id,
                name: coaching.instructor.name,
                bio: coaching.instructor.bio || 'Professional Coach',
                avatarUrl: coaching.instructor.picture || ''
              });
            }
          } catch (e) {
            console.error('Failed to fetch coaching:', e);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const email = session.user.email!;
          const existingUser = await getUserByEmail(email);

          if (existingUser) {
            // If user_type is null, show account type selection
            if (!existingUser.user_type) {
              setCurrentUser({
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
                picture: existingUser.picture,
                userType: undefined,
                username: existingUser.username,
                bio: existingUser.bio,
                isProfileComplete: false,
                remaining: 0
              } as User);
              setCurrentView(ViewState.ACCOUNT_TYPE_SELECTION);
              setLoading(false);
              return;
            }

            // User has user_type set
            // Check if there's an invitation code to accept
            if (inviteCode) {
              try {
                await acceptInvitation(inviteCode, existingUser.id, email);
                alert('강사와 연결되었습니다! 이제 예약이 가능합니다.');
                // Remove invite param from URL
                window.history.replaceState({}, '', window.location.pathname);
              } catch (e: any) {
                console.error('Failed to accept invitation:', e);
                if (e.message) {
                  alert(e.message);
                }
              }
            }

            setCurrentUser({
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              picture: existingUser.picture,
              userType: existingUser.user_type as UserType,
              username: existingUser.username,
              bio: existingUser.bio,
              isProfileComplete: true,
              remaining: 0
            } as User);

            // If URL has coaching slug param, show reservation page
            if (coachingSlug) {
              setCurrentView(ViewState.RESERVATION);
            } else if (coachEmail) {
              // If URL has coach email, show instructor selection
              setCurrentView(ViewState.INSTRUCTOR_SELECT);
            } else {
              setCurrentView(ViewState.DASHBOARD);
            }
          }
        } else {
          // Not logged in - check if this is a public booking page or invite link
          if (coachingSlug || inviteCode) {
            setCurrentView(ViewState.RESERVATION);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [coachingSlug]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);

    // user_type이 없으면 계정 유형 선택 화면으로
    if (!user.userType) {
      setCurrentView(ViewState.ACCOUNT_TYPE_SELECTION);
    }
    // 강사이고 프로필 미완성 시 스튜디오 설정으로
    else if (user.userType === UserType.INSTRUCTOR && !user.isProfileComplete) {
      setCurrentView(ViewState.STUDIO_SETUP);
    } else {
      setCurrentView(ViewState.DASHBOARD);
    }
  };

  const handleSelectUserType = async (userType: 'instructor' | 'student') => {
    if (!currentUser) return;

    try {
      const updatedUser = await selectUserType(currentUser.id!, userType);

      const user: User = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        picture: updatedUser.picture,
        userType: updatedUser.user_type as UserType,
        username: updatedUser.username,
        bio: updatedUser.bio,
        isProfileComplete: userType === 'student', // 수강생은 바로 완료
        remaining: 0
      };

      setCurrentUser(user);

      // 강사는 스튜디오 설정으로, 수강생은 대시보드로
      if (userType === 'instructor') {
        setCurrentView(ViewState.STUDIO_SETUP);
      } else {
        setCurrentView(ViewState.DASHBOARD);
      }
    } catch (error) {
      console.error('Failed to select user type:', error);
      alert('계정 유형 선택에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(); // Supabase 세션 삭제
      setCurrentUser(null);
      setCurrentView(ViewState.LANDING);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
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
    switch (currentView) {
      case ViewState.LANDING:
        return (
          <LandingPage
            onLoginSuccess={handleLogin}
            onShowLogin={() => setCurrentView(ViewState.LOGIN)}
          />
        );

      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} />;

      case ViewState.ACCOUNT_TYPE_SELECTION:
        return (
          <AccountTypeSelection
            onSelectType={handleSelectUserType}
            onBack={handleLogout}
          />
        );

      case ViewState.STUDIO_SETUP:
        if (!currentUser) return null;
        return (
          <StudioSetup
            user={currentUser}
            onComplete={(updatedUser) => {
              setCurrentUser(updatedUser);
              setCurrentView(ViewState.DASHBOARD);
            }}
          />
        );

      case ViewState.DASHBOARD:
        if (!currentUser) return null;
        return (
          <Dashboard
            user={currentUser}
            // 강사 선택 단계 없이 바로 예약 화면으로 이동 (단일 강사 모드)
            onNavigateToReservation={() => setCurrentView(ViewState.RESERVATION)}
            onNavigateToProfile={() => setCurrentView(ViewState.PROFILE)}
            onLogout={handleLogout}
          />
        );

      case ViewState.INSTRUCTOR_SELECT:
        // Show coaching list for selected instructor
        if (!currentInstructor) {
          return (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-slate-600 mb-4">강사 정보가 없습니다.</p>
                <button
                  onClick={() => setCurrentView(ViewState.LANDING)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          );
        }
        return (
          <PublicBooking
            instructor={currentInstructor}
            user={currentUser}
            onSelectCoaching={(coachingSlug) => {
              // Navigate to reservation page with coaching slug
              window.history.pushState({}, '', `/${coachingSlug}`);
              setCurrentView(ViewState.RESERVATION);
            }}
            onBack={() => setCurrentView(currentUser ? ViewState.DASHBOARD : ViewState.LANDING)}
          />
        );

      case ViewState.RESERVATION:
        // Public booking page - instructor is required, but user can be null (guest booking)
        if (!currentInstructor) {
          return (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-slate-600 mb-4">잘못된 접근입니다.</p>
                <p className="text-sm text-slate-400">URL에 강사 정보(?slug=프로젝트슬러그)가 필요합니다.</p>
              </div>
            </div>
          );
        }
        return (
          <Reservation
            user={currentUser}
            instructor={currentInstructor}
            onBack={() => setCurrentView(currentUser ? ViewState.DASHBOARD : ViewState.LANDING)}
            onSuccess={() => {
              setCurrentView(currentUser ? ViewState.DASHBOARD : ViewState.LANDING);
            }}
          />
        );

      case ViewState.PROFILE:
        if (!currentUser || currentUser.userType !== UserType.INSTRUCTOR) return null;
        return (
          <InstructorProfile
            user={currentUser}
            onUpdate={(updatedUser) => {
              setCurrentUser(updatedUser);
            }}
            onBack={() => setCurrentView(ViewState.DASHBOARD)}
            onLogout={handleLogout}
          />
        );

      case ViewState.PRIVACY:
        return (
          <PrivacyPolicy
            onBack={() => {
              window.history.replaceState({}, '', '/');
              setCurrentView(currentUser ? ViewState.DASHBOARD : ViewState.LANDING);
            }}
          />
        );

      case ViewState.TERMS:
        return (
          <TermsOfService
            onBack={() => {
              window.history.replaceState({}, '', '/');
              setCurrentView(currentUser ? ViewState.DASHBOARD : ViewState.LANDING);
            }}
          />
        );

      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  // Full-screen views without Layout (Landing, Dashboard, Profile, Privacy, Terms, AccountTypeSelection)
  const fullScreenViews = [ViewState.LANDING, ViewState.DASHBOARD, ViewState.PROFILE, ViewState.PRIVACY, ViewState.TERMS, ViewState.ACCOUNT_TYPE_SELECTION];

  if (fullScreenViews.includes(currentView)) {
    return (
      <ErrorBoundary>
        {renderContent()}
      </ErrorBoundary>
    );
  }

  // Other views wrapped in Layout (Login, Reservation, etc.)
  return (
    <ErrorBoundary>
      <Layout title="예약매니아">
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;