import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { requestOtp, verifyOtp, updateMe } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'phone' | 'otp' | 'name';

const RESEND_COOLDOWN = 30;

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const login = useAuthStore((s) => s.login);
  const onLogin = useTaskStore((s) => s.onLogin);

  const [step, setStep] = useState<Step>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Stored after verify so name step can use them
  const pendingAuth = useRef<{ token: string; phone: string; display_name: string | null } | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setStep('phone');
      setPhoneDigits('');
      setOtp(['', '', '', '', '', '']);
      setNameInput('');
      setError('');
      setCooldown(0);
      pendingAuth.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const fullPhone = `${countryCode}${phoneDigits}`;

  async function handleSendOtp() {
    setError('');
    if (!phoneDigits.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(fullPhone);
      setStep('otp');
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtp(fullPhone, code);
      pendingAuth.current = { token: res.access_token, phone: res.user.phone_number, display_name: res.user.display_name };

      if (!res.user.display_name) {
        setStep('name');
      } else {
        await login(res.access_token, { phone_number: res.user.phone_number, display_name: res.user.display_name });
        await onLogin();
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    if (!pendingAuth.current) return;
    setError('');
    setLoading(true);
    const name = nameInput.trim() || null;
    try {
      await login(pendingAuth.current.token, { phone_number: pendingAuth.current.phone, display_name: name });
      if (name) {
        await updateMe({ display_name: name });
      }
      await onLogin();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save name.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      await requestOtp(fullPhone);
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (value && index === 5 && next.every((d) => d !== '')) {
      setTimeout(() => handleVerify(), 0);
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerify();
    }
  }

  function handleOtpPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? '';
    }
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
    if (pasted.length === 6) {
      setTimeout(() => handleVerify(), 0);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === 'name' ? 'One last thing' : 'Connect via WhatsApp'}
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' && 'Enter your WhatsApp number to receive a one-time code.'}
            {step === 'otp' && `Enter the 6-digit code sent to ${fullPhone}`}
            {step === 'name' && 'What should we call you?'}
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                className="w-20 text-center"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                placeholder="+91"
                maxLength={5}
              />
              <Input
                className="flex-1"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              className="nav-btn nav-btn--text w-full justify-center py-2 text-sm font-medium"
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send OTP on WhatsApp'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-10 h-12 text-center text-lg font-semibold rounded-md border border-input bg-transparent shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              ))}
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              className="nav-btn nav-btn--text w-full justify-center py-2 text-sm font-medium"
              onClick={handleVerify}
              disabled={loading || otp.some((d) => d === '')}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <div className="flex justify-between text-xs text-muted-foreground">
              <button
                onClick={() => { setStep('phone'); setError(''); setOtp(['', '', '', '', '', '']); }}
                className="hover:underline"
              >
                ← Change number
              </button>
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="hover:underline disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="flex flex-col gap-4">
            <Input
              placeholder="e.g. Kaushal"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              maxLength={100}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              className="nav-btn nav-btn--text w-full justify-center py-2 text-sm font-medium"
              onClick={handleSaveName}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Get started'}
            </button>
            <button
              className="text-xs text-muted-foreground hover:underline text-center"
              onClick={handleSaveName}
              disabled={loading}
            >
              Skip for now
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
