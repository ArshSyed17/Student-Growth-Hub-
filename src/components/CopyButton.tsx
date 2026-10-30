import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../lib/utils';
import { useToast } from './Toast';

export function CopyButton({
  text,
  label = 'Copy link',
  small = false,
}: {
  text: string;
  label?: string;
  small?: boolean;
}) {
  const notify = useToast();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      notify('success', 'Link copied to clipboard.');
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      notify('error', 'Could not copy automatically. Select the link and copy it manually.');
    }
  };

  return (
    <button type="button" onClick={onCopy} className={`btn-secondary ${small ? 'btn-sm' : ''}`}>
      {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  );
}
