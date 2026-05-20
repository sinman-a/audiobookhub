'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface SimilarBook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  genre: string;
  duration: string;
}

interface Props {
  books: SimilarBook[];
}

export function SimilarBooks({ books }: Props) {
  const t = useTranslations();
  const locale = useLocale();

  if (books.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-4">{t('similar_books')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/${locale}/book/${book.id}`}
            className="group rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
          >
            <div className="relative aspect-[2/3] overflow-hidden bg-black/20">
              <Image
                src={book.imageUrl || '/placeholder.jpg'}
                alt={book.title}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{book.title}</p>
              <p className="text-xs text-white/50 truncate">{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
