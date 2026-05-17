import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { clearAllData } from '../../services/chromeStorage';

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const logout = useAuthStore((s) => s.logout);
  const onLogout = useTaskStore((s) => s.onLogout);
  const showNotification = useTaskStore((s) => s.showNotification);

  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!acknowledged) return;
    setLoading(true);
    try {
      await clearAllData();
      await onLogout();
      await logout();
      showNotification('Signed out — local data cleared', 'info', 3000);
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to sign out';
      showNotification(msg, 'error', 4000);
    } finally {
      setLoading(false);
      setAcknowledged(false);
    }
  }

  function handleCancel() {
    setAcknowledged(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setAcknowledged(false); onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign out?</DialogTitle>
          <DialogDescription>
            Your tasks are safely saved in the cloud. To keep this browser clean, we'll
            also remove all locally cached task data. You can sign back in anytime to restore everything.
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5"
          />
          <span>Yes, clear data from this browser</span>
        </label>

        <div className="flex gap-2 justify-end mt-2">
          <button
            className="nav-btn nav-btn--text px-4 py-2 text-sm"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="nav-btn nav-btn--text px-4 py-2 text-sm font-medium disabled:opacity-50"
            onClick={handleConfirm}
            disabled={!acknowledged || loading}
            style={{ color: '#dc2626' }}
          >
            {loading ? 'Signing out…' : 'Sign out & clear'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
