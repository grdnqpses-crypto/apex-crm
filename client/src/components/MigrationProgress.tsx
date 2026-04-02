/**
 * MigrationProgress Component
 * Real-time display of migration and setup progress
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMigrationProgress, formatTime, getStatusIcon, getStatusColor, getStatusBgColor, type MigrationEvent } from '../hooks/useMigrationProgress';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface MigrationProgressProps {
  migrationId: string;
  token?: string;
  onComplete?: () => void;
}

export function MigrationProgress({ migrationId, token, onComplete }: MigrationProgressProps) {
  const {
    events,
    overallProgress,
    timeElapsed,
    estimatedTimeRemaining,
    isComplete,
    hasErrors,
    isConnected,
    disconnect,
  } = useMigrationProgress({
    migrationId,
    token,
    onComplete,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastEventRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (lastEventRef.current && !isPaused) {
      lastEventRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [events, isPaused]);

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    disconnect();
    // TODO: Call API to cancel migration
  };

  const handleExportLogs = () => {
    const logsJson = JSON.stringify(events, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-${migrationId}-logs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Migration in Progress</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isComplete ? 'Migration complete' : 'Setting up your AXIOM CRM...'}
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Time Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Time elapsed: {formatTime(timeElapsed)}</span>
          {estimatedTimeRemaining && !isComplete && (
            <span>Estimated time remaining: {formatTime(estimatedTimeRemaining)}</span>
          )}
        </div>
      </div>

      {/* Event Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-3"
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>Waiting for migration to start...</p>
          </div>
        ) : (
          events.map((event, index) => (
            <EventItem
              key={event.id}
              event={event}
              isExpanded={expandedEvents.has(event.id)}
              onToggleExpand={() => toggleEventExpanded(event.id)}
              isLast={index === events.length - 1}
              ref={index === events.length - 1 ? lastEventRef : null}
            />
          ))
        )}
      </div>

      {/* Control Panel */}
      <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={isPaused ? 'default' : 'outline'}
            size="sm"
            onClick={handlePause}
            disabled={isComplete}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
          >
            Export Logs
          </Button>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={isComplete}
        >
          Cancel
        </Button>
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <div className="border-t border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            ⚠️ Some errors occurred during migration. Please review the logs above.
          </p>
        </div>
      )}
    </div>
  );
}

interface EventItemProps {
  event: MigrationEvent;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLast: boolean;
}

const EventItem = React.forwardRef<HTMLDivElement, EventItemProps>(
  ({ event, isExpanded, onToggleExpand, isLast }, ref) => {
    const hasChildren = event.children && event.children.length > 0;
    const hasDetails = event.details || event.progress || event.metadata;

    return (
      <div
        ref={ref}
        className={`rounded-lg border p-4 transition-colors ${getStatusBgColor(event.status)}`}
      >
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={onToggleExpand}
        >
          <span className="text-lg mt-0.5">{getStatusIcon(event.status)}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{event.action}</h3>
              {event.duration && (
                <span className="text-xs text-gray-500">({event.duration}ms)</span>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-1">{event.message}</p>

            {/* Progress Bar */}
            {event.progress && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${event.progress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {event.progress.current} / {event.progress.total}
                </p>
              </div>
            )}
          </div>

          {(hasChildren || hasDetails) && (
            <button
              className="text-gray-500 hover:text-gray-700 mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 ml-7 space-y-2 border-l-2 border-gray-300 pl-3">
            {event.details && (
              <div className="text-xs bg-white bg-opacity-50 p-2 rounded font-mono text-gray-700">
                {event.details}
              </div>
            )}

            {event.metadata && (
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span>{' '}
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                ))}
              </div>
            )}

            {event.children && event.children.length > 0 && (
              <div className="space-y-2">
                {event.children.map(child => (
                  <EventItem
                    key={child.id}
                    event={child}
                    isExpanded={false}
                    onToggleExpand={() => {}}
                    isLast={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

EventItem.displayName = 'EventItem';
