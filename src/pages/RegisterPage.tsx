import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  FileCheck2,
  GraduationCap,
  Lightbulb,
  Link2,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/AppStore';
import { CAMPAIGN, REF_SESSION_KEY } from '../lib/constants';
import type { FieldErrors, RegistrationInput } from '../lib/logic';
import type { Registration } from '../types';
import { Alert, Badge, Field, Spinner } from '../components/ui';
import { CopyButton } from '../components/CopyButton';
import { getOrigin } from '../lib/utils';

const BENEFITS = [
  {
    icon: Rocket,
    title: 'Ship something real',
    text: 'Leave with a working AI mini-project you built yourself, not just slides you watched.',
  },
  {
    icon: Code2,
    title: 'Beginner friendly',
    text: 'No prior AI experience needed. Basic programming comfort is enough to follow along.',
  },
  {
    icon: Clock,
    title: 'Just 60 minutes',
    text: 'A focused, guided session that fits around your classes and placement prep.',
  },
  {
    icon: FileCheck2,
    title: 'Portfolio-ready',
    text: 'Add a concrete project to your resume and GitHub profile before placement season.',
  },
];

const AUDIENCE = [
  'Final-year engineering students (any branch) curious about AI',
  'Students preparing for campus placements who want a project to talk about',
  'Anyone who has watched AI tutorials but never built something end to end',
];

function readInitialRef(urlRef: string): string {
  if (urlRef) return urlRef;
  try {
    return sessionStorage.getItem(REF_SESSION_KEY) ?? '';
  } catch {
    return '';
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RegisterPage() {
  const [params] = useSearchParams();
  const urlRef = (params.get('ref') ?? '').trim().toUpperCase().slice(0, 20);
  const { addRegistration } = useAppStore();

  const [form, setForm] = useState<RegistrationInput & { referralCode: string }>({
    fullName: '',
    email: '',
    college: '',
    referralCode: readInitialRef(urlRef),
    consent: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [done, setDone] = useState<{ registration: Registration; note?: string; persisted: boolean } | null>(
    null,
  );

  // Preserve the referral code from the URL for the rest of this browser session.
  useEffect(() => {
    if (!urlRef) return;
    setForm((f) => (f.referralCode ? f : { ...f, referralCode: urlRef }));
    try {
      sessionStorage.setItem(REF_SESSION_KEY, urlRef);
    } catch {
      /* ignore */
    }
  }, [urlRef]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as keyof FieldErrors]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const scrollToForm = () => {
    const el = document.getElementById('register');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('fullName')?.focus({ preventScroll: true }), 400);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    setFormError(null);
    setStatus('submitting');
    await sleep(450); // brief, deliberate pause so the loading state is visible
    const result = addRegistration(form);
    if (!result.ok) {
      setErrors(result.errors);
      setStatus('idle');
      setFormError(
        result.reason === 'duplicate'
          ? 'That email is already registered. Each email address can register only once.'
          : 'Please fix the highlighted fields and try again.',
      );
      return;
    }
    setDone({ registration: result.registration, note: result.referralNote, persisted: result.persisted });
    setStatus('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setForm({ fullName: '', email: '', college: '', referralCode: readInitialRef(urlRef), consent: false });
    setErrors({});
    setFormError(null);
    setDone(null);
    setStatus('idle');
  };

  const inputCls = (name: keyof FieldErrors) => `input ${errors[name] ? 'input-error' : ''}`;
  const aria = (name: keyof FieldErrors, hint = false) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : hint ? `${name}-hint` : undefined,
  });

  if (status === 'success' && done) {
    const first = done.registration.fullName.split(' ')[0];
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="card p-6 text-center sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-navy-900">
            You're registered, {first}!
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your prototype registration has been saved in this browser.
          </p>
          <p className="mt-4 inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs text-navy-800">
            {done.registration.id}
          </p>

          <div className="mt-6 space-y-3 text-left">
            {done.registration.source === 'Referral' && (
              <Alert tone="success" title="Referral applied">
                This registration was credited to code <strong>{done.registration.referralCode}</strong>.
              </Alert>
            )}
            {done.note && <Alert tone="warning">{done.note}</Alert>}
            {!done.persisted && (
              <Alert tone="error" title="Not saved">
                Your browser blocked local storage, so this registration will be lost on refresh.
              </Alert>
            )}
            <Alert tone="info" title="This is a prototype">
              This page is part of an independent internship assignment. It does not register you for a real
              NxtWave event and no confirmation email is sent.
            </Alert>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4 text-left">
            <p className="text-sm font-semibold text-navy-900">Know a classmate who'd enjoy this?</p>
            <p className="mt-1 text-xs text-slate-500">Share the workshop page with one interested friend.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={`${getOrigin()}/register`} label="Copy workshop link" small />
            </div>
          </div>

          <button type="button" className="btn-ghost mt-6" onClick={reset}>
            Register another student
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:py-20">
          <div className="lg:col-span-3">
            <Badge tone="indigo">
              <Sparkles className="mr-1 h-3 w-3" aria-hidden /> Free student workshop
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {CAMPAIGN.workshopTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-200 sm:text-lg">
              A hands-on, beginner-friendly session for final-year engineering students. Go from zero to a
              working AI project you can show recruiters, in one hour.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={scrollToForm} className="btn-primary px-6 py-3 text-base">
                Register Free <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <span className="text-sm text-navy-300">Free • 60 minutes • No prior AI experience needed</span>
            </div>
            {urlRef && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-navy-100">
                <Link2 className="h-4 w-4" aria-hidden /> Invited with referral code{' '}
                <strong className="font-mono">{urlRef}</strong>
              </p>
            )}
          </div>
          <div className="hidden lg:col-span-2 lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">What you'll build</p>
              <ul className="mt-4 space-y-3 text-sm text-navy-100">
                {[
                  'Set up your environment in minutes',
                  'Call an AI model from your own code',
                  'Wrap it in a small, working app',
                  'Know exactly how to extend it after',
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits + form */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:py-16">
        <div className="space-y-12 lg:col-span-3">
          <section>
            <h2 className="text-xl font-semibold text-navy-900">Why attend</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-semibold text-navy-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-navy-900">
              <GraduationCap className="h-5 w-5 text-indigo-600" aria-hidden /> Who should attend
            </h2>
            <ul className="mt-4 space-y-3">
              {AUDIENCE.map((a) => (
                <li key={a} className="flex gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                  {a}
                </li>
              ))}
            </ul>
          </section>

          <section className="card border-indigo-100 bg-indigo-50/50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-navy-900">
              <Lightbulb className="h-5 w-5 text-indigo-600" aria-hidden /> Learning outcome
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              By the end of the hour you will understand how a modern AI model is used inside a real
              application, and you will have built and run your own first AI-powered project from scratch.
              You'll know which pieces to swap to turn it into something uniquely yours.
            </p>
          </section>
        </div>

        {/* Form */}
        <aside className="lg:col-span-2">
          <div id="register" className="card scroll-mt-6 p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-navy-900">Reserve your free spot</h2>
            <p className="mt-1 text-sm text-slate-500">Takes under a minute. No payment needed.</p>

            {formError && (
              <div className="mt-4">
                <Alert tone="error">{formError}</Alert>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
              <Field id="fullName" label="Full name" error={errors.fullName}>
                <input
                  id="fullName"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={inputCls('fullName')}
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="e.g. Asha Rao"
                  maxLength={80}
                  {...aria('fullName')}
                />
              </Field>

              <Field id="email" label="Email address" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={inputCls('email')}
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@college.edu"
                  {...aria('email')}
                />
              </Field>

              <Field id="college" label="College name" error={errors.college}>
                <input
                  id="college"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  className={inputCls('college')}
                  value={form.college}
                  onChange={(e) => set('college', e.target.value)}
                  placeholder="Your engineering college"
                  maxLength={120}
                  {...aria('college')}
                />
              </Field>

              <Field
                id="referralCode"
                label="Referral code"
                optional
                error={errors.referralCode}
                hint={urlRef ? 'Applied from your invite link.' : 'Got an invite from a student ambassador? Enter their code.'}
              >
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  autoComplete="off"
                  className={`${inputCls('referralCode')} font-mono uppercase`}
                  value={form.referralCode}
                  onChange={(e) => set('referralCode', e.target.value.toUpperCase())}
                  placeholder="e.g. ARSH01"
                  maxLength={20}
                  {...aria('referralCode', true)}
                />
              </Field>

              <div>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    id="consent"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={form.consent}
                    onChange={(e) => set('consent', e.target.checked)}
                    {...aria('consent')}
                  />
                  <span>
                    I agree that my name, email and college are processed to register me for this workshop and
                    to send workshop updates.
                  </span>
                </label>
                {errors.consent && (
                  <p id="consent-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                    {errors.consent}
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary w-full py-3" disabled={status === 'submitting'}>
                {status === 'submitting' ? (
                  <>
                    <Spinner /> Registering…
                  </>
                ) : (
                  'Register Free'
                )}
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              <p>
                <strong>Prototype notice:</strong> this form saves your entry only in this browser. It does not
                register you for a real NxtWave event, and we only ask for the minimum details above.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
