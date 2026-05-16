import { getRequestConfig } from 'next-intl/server';

const loaders: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  uk: () => import('../messages/uk.json'),
  en: () => import('../messages/en.json'),
};

export default getRequestConfig(async ({ locale }) => {
  const load = loaders[locale ?? 'uk'] ?? loaders['uk'];
  const messages = (await load()).default;
  return { messages };
});
