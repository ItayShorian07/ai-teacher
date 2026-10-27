import { siteNames } from '@/config/environments.json';
import 'server-only';
import { appEnvironment } from './environment';

export const applicationName =
  appEnvironment(process.env) === 'production'
    ? siteNames.production
    : siteNames.development;

export function pageTitle(title: string): string {
  return `${title} | ${applicationName}`;
}
