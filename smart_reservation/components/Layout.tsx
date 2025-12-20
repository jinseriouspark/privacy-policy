import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex flex-col items-center justify-start md:justify-center p-3 sm:p-4 md:p-6 font-sans">
      <div className="w-full max-w-md lg:max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-4 md:my-0">
        <div className="h-1.5 sm:h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-400 w-full"></div>
        <div className="p-5 sm:p-6 md:p-8">
          {title && (
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 tracking-tight text-center">
              {title}
            </h1>
          )}
          {children}
        </div>
      </div>
      <p className="mt-4 sm:mt-6 md:mt-8 text-[10px] sm:text-xs text-slate-400">
        © 2025 예약매니아
      </p>
    </div>
  );
};

export default Layout;