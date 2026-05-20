'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (stars: number) => void;
}

export function RatingModal({ open, onClose, onSubmit }: Props) {
  const t = useTranslations();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setSelected(0);
      setHovered(0);
    }
  }, [open]);

  const handleSubmit = () => {
    if (selected === 0) return;
    setSubmitted(true);
    onSubmit(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {submitted ? t('rate_thanks') : t('rate_title')}
          </DialogTitle>
        </DialogHeader>

        {!submitted && (
          <div className="flex flex-col items-center gap-6 py-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(star)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${star} stars`}
                >
                  <Star
                    className={`h-9 w-9 transition-colors ${
                      star <= (hovered || selected)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-white/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/50"
              >
                {t('rate_skip')}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={selected === 0}
                className="bg-blue-500 hover:bg-blue-400 text-white"
              >
                {t('rate_submit')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
