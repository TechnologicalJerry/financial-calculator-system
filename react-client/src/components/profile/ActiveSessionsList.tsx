'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Laptop, Phone, ShieldAlert, Trash2 } from 'lucide-react';

export function ActiveSessionsList() {
  const queryClient = useQueryClient();

  const {
    data: sessions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: () => userService.getActiveSessions(),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => userService.revokeSession(sessionId),
    onSuccess: () => {
      toast.success('Session revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
    },
    onError: () => {
      toast.error('Failed to revoke session');
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => userService.revokeAllSessions(),
    onSuccess: () => {
      toast.success('All active sessions revoked');
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
    },
    onError: () => {
      toast.error('Failed to revoke all sessions');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-slate-400">
        <Spinner />
        <span className="text-sm">Loading active sessions...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl text-red-300 text-sm">
        Failed to load active sessions.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Active Sessions</h3>
          <p className="text-xs text-slate-400">Manage devices currently logged into your account.</p>
        </div>

        {sessions.length > 1 && (
          <Button
            variant="danger"
            size="sm"
            isLoading={revokeAllMutation.isPending}
            onClick={() => revokeAllMutation.mutate()}
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
            Revoke All Sessions
          </Button>
        )}
      </div>

      <div className="space-y-2.5">
        {sessions.map((session) => {
          const isMobile = /mobile/i.test(session.userAgent || '');
          const formattedCreated = new Date(session.createdAt).toLocaleString();

          return (
            <div
              key={session.id}
              className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-slate-800 rounded-lg text-indigo-400 shrink-0">
                  {isMobile ? <Phone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                </div>

                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">
                      {session.deviceName || 'Browser Session'}
                    </span>
                    {session.isCurrentSession && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                        Current Device
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 font-mono text-[11px]">IP: {session.ipAddress || 'Unknown'}</p>
                  <p className="text-slate-500">Logged in: {formattedCreated}</p>
                </div>
              </div>

              {!session.isCurrentSession && (
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={revokeMutation.isPending && revokeMutation.variables === session.id}
                  onClick={() => revokeMutation.mutate(session.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}

        {sessions.length === 0 && (
          <p className="text-xs text-slate-500 py-4 text-center">No active sessions found.</p>
        )}
      </div>
    </div>
  );
}
