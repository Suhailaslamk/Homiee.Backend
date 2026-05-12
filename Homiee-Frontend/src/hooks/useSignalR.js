import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export function useSignalR(hubUrl, onMessage, { eventName = 'ReceiveMessage', enabled = true } = {}) {
  const connectionRef = useRef(null);
  const [status, setStatus] = useState(enabled ? 'connecting' : 'idle');
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !hubUrl) {
      setStatus('idle');
      return undefined;
    }

    const token = localStorage.getItem('token');

    if (!token || token === 'undefined') {
      setStatus('idle');
      return undefined;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds > 60000) return null; // Stop after 1 minute
          return Math.min(2000 * retryContext.previousRetryCount, 10000);
        },
      })
      .configureLogging(signalR.LogLevel.Error)
      .build();

    let isStarting = true;
    let cancelled = false;

    connection.on(eventName, (payload) => {
      onMessageRef.current?.(payload);
    });

    connection.onreconnecting(() => setStatus('reconnecting'));
    connection.onreconnected(() => setStatus('connected'));
    connection.onclose(() => setStatus('disconnected'));

    connection
      .start()
      .then(() => {
        isStarting = false;
        if (!cancelled) {
          setStatus('connected');
        } else {
          // If already cancelled, stop it now
          connection.stop().catch(() => {});
        }
      })
      .catch((error) => {
        isStarting = false;
        // If we get a 401 or negotiation error, don't spam the console if we're unauthenticated
        const isAuthError = error.message?.includes('401') || error.message?.includes('negotiation');
        const isAbortError = error.name === 'AbortError' || error.message?.includes('stop() was called');

        if (isAuthError) {
          console.warn('SignalR: Authentication or Negotiation failed. Downgrading to guest state.');
          import('../utils/auth').then(({ handleAuthError }) => handleAuthError());
        } else if (!isAbortError) {
          console.error('SignalR connection error:', error);
        }

        if (!cancelled) {
          setStatus('error');
        }
      });

    connectionRef.current = connection;

    return () => {
      cancelled = true;
      connection.off(eventName);
      
      // Prevent stop() during start() which triggers the internal library error
      if (!isStarting && connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
      
      connectionRef.current = null;
    };
  }, [enabled, eventName, hubUrl]);

  return { connectionRef, status };
}
