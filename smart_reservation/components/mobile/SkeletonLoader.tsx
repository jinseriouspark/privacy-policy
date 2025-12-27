import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-white rounded-2xl p-4 border border-slate-200">
    <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
  </div>
);

export const SkeletonPackageCard: React.FC = () => (
  <div className="animate-pulse bg-slate-50 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-5 bg-slate-200 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
      <div className="text-right">
        <div className="h-8 w-16 bg-slate-200 rounded mb-1"></div>
        <div className="h-3 w-12 bg-slate-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const SkeletonReservationCard: React.FC = () => (
  <div className="animate-pulse bg-white rounded-xl p-4 border border-slate-200">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
    </div>
  </div>
);

export const SkeletonHomeLoader: React.FC = () => (
  <div className="pb-20 bg-slate-50 min-h-screen">
    {/* Header Skeleton */}
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="animate-pulse">
            <div className="h-7 bg-slate-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
        <div className="animate-pulse w-10 h-10 bg-slate-200 rounded-full"></div>
      </div>
    </div>

    {/* Content Skeletons */}
    <div className="px-6 pt-6 space-y-6">
      {/* Summary Card Skeleton */}
      <div className="animate-pulse bg-slate-200 rounded-2xl h-32"></div>

      {/* Today's Classes Header */}
      <div className="animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
      </div>

      {/* Class Cards */}
      <SkeletonCard />
      <SkeletonCard />

      {/* Packages Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
          <SkeletonPackageCard />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonReservationsLoader: React.FC = () => (
  <div className="pb-20 bg-slate-50 min-h-screen">
    {/* Header Skeleton */}
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-20"></div>
      </div>
    </div>

    {/* Filter Tabs Skeleton */}
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex gap-2">
        <div className="animate-pulse flex-1 h-10 bg-slate-200 rounded-lg"></div>
        <div className="animate-pulse flex-1 h-10 bg-slate-200 rounded-lg"></div>
        <div className="animate-pulse flex-1 h-10 bg-slate-200 rounded-lg"></div>
      </div>
    </div>

    {/* Reservation Cards */}
    <div className="px-6 pt-4 space-y-3">
      <SkeletonReservationCard />
      <SkeletonReservationCard />
      <SkeletonReservationCard />
    </div>
  </div>
);

export const SkeletonCalendarLoader: React.FC = () => (
  <div className="pb-20 bg-slate-50 min-h-screen">
    {/* Header Skeleton */}
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="animate-pulse h-7 bg-slate-200 rounded w-32"></div>
        <div className="animate-pulse h-8 w-16 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Week Navigation Skeleton */}
      <div className="flex items-center justify-between">
        <div className="animate-pulse w-10 h-10 bg-slate-200 rounded-lg"></div>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-24 mb-1"></div>
          <div className="h-4 bg-slate-200 rounded w-20 mx-auto"></div>
        </div>
        <div className="animate-pulse w-10 h-10 bg-slate-200 rounded-lg"></div>
      </div>
    </div>

    {/* Week Grid Skeleton */}
    <div className="px-4 pt-4">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="animate-pulse aspect-square bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    </div>

    {/* Selected Date Info Skeleton */}
    <div className="px-6 pb-4">
      <div className="animate-pulse bg-slate-200 rounded-2xl h-20"></div>
    </div>

    {/* Reservations List Skeleton */}
    <div className="px-6 space-y-3">
      <SkeletonReservationCard />
      <SkeletonReservationCard />
    </div>
  </div>
);
