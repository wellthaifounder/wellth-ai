import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Session timeout hook for healthcare application security
 * Implements automatic logout after inactivity to protect PHI
 *
 * @param timeoutMinutes - Minutes of inactivity before logout (default: 15)
 * @param warningMinutes - Minutes before timeout to show warning (default: 2)
 */
export const useSessionTimeout = (
  timeoutMinutes: number = 15,
  warningMinutes: number = 2
) => {
  const navigate = useNavigate();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningToastIdRef = useRef<string | number | null>(null);

  const clearAllTimers = () => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (warningIdRef.current) clearTimeout(warningIdRef.current);
    if (warningToastIdRef.current) toast.dismiss(warningToastIdRef.current);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.clear();
      navigate('/auth');
      toast.error('Session expired for security. Please log in again.', {
        duration: 5000,
      });
    } catch (error) {
      console.error('Error during automatic logout:', error);
    }
  };

  const showWarning = () => {
    warningToastIdRef.current = toast.warning(
      `Your session will expire in ${warningMinutes} minutes due to inactivity. Move your mouse or click to stay logged in.`,
      {
        duration: Infinity,
        action: {
          label: 'Stay Logged In',
          onClick: () => {
            if (warningToastIdRef.current) {
              toast.dismiss(warningToastIdRef.current);
            }
            resetTimeout();
          },
        },
      }
    );
  };

  const resetTimeout = () => {
    clearAllTimers();

    // Show warning at specified time before timeout
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningIdRef.current = setTimeout(showWarning, warningMs);

    // Logout after full timeout
    const timeoutMs = timeoutMinutes * 60 * 1000;
    timeoutIdRef.current = setTimeout(handleLogout, timeoutMs);
  };

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearAllTimers();
        return;
      }

      // Start timeout monitoring
      resetTimeout();
    };

    checkAuth();

    // Listen for user activity to reset timeout
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    // Cleanup on unmount
    return () => {
      clearAllTimers();
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [timeoutMinutes, warningMinutes]);

  return null;
};
