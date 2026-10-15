import { createContext, runInContext } from 'node:vm';
import script from '../../public/assets/site.js?raw';
import { getArticleFeed } from './articles';

// Reuse the same trusted local templates for built HTML and browser interactions.
// Browser-only initialization is excluded from this build-time execution.
export async function renderArchive(kind: 'home' | 'category', category = 'all') {
  const feed = await getArticleFeed();
  const context = createContext({
    document: { getElementById: () => ({ textContent: JSON.stringify(feed) }) },
    window: {},
  });
  runInContext(script.slice(0, script.indexOf('function initSite(){')), context);
  context.archiveCategory = category;
  const html = runInContext(kind === 'home' ? 'home()' : 'categoryPage(archiveCategory)', context) as string;
  return html.replace(/href="#(home|about|category\/[^"#]+|article\/[^"#]+)"/g, (_, route: string) => {
    context.targetRoute = route;
    return `href="/${runInContext('routeToPage(targetRoute)', context)}"`;
  });
}
