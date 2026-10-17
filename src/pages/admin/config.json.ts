import categories from '../../data/categories.json';
import settings from '../../data/cms.js';

export function GET() {
  const root = settings.contentRoot ? settings.contentRoot.replace(/\/$/, '') + '/' : '';
  const config = {
    load_config_file: false,
    backend: { name: 'github', repo: settings.repo, branch: settings.branch, auth_endpoint: 'api/auth' },
    locale: 'zh_Hant',
    media_folder: `${root}public/images/uploads`,
    public_folder: '/images/uploads',
    slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },
    collections: [{
      name: 'articles', label: '文章', label_singular: '文章',
      folder: `${root}src/content/articles`, create: true, delete: false,
      extension: 'md', format: 'frontmatter', slug: '{{fields.urlSlug}}',
      preview_path: 'articles/{{slug}}.html',
      summary: '{{title}} · {{date}}', sortable_fields: ['date', 'title', 'draft'],
      editor: { preview: false },
      fields: [
        { name: 'title', label: '文章標題', widget: 'string' },
        { name: 'urlSlug', label: '網址代碼', widget: 'string', pattern: ['^[a-z0-9]+(?:-[a-z0-9]+)*$', '請使用英文小寫、數字及連字號'], hint: '例如 kyoto-walk。既有文章請保留原值，避免原有連結失效。' },
        { name: 'date', label: '文章日期', widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false },
        { name: 'category', label: '主分類', widget: 'select', options: categories.map(category => ({ label: category.title, value: category.id })) },
        { name: 'subcategory', label: '子分類', widget: 'select', options: categories.flatMap(category => category.groups.flatMap(group => group.items.map(item => ({ label: `${category.title}／${item[0]}`, value: item[0] })))), hint: '請選擇與主分類相同的子分類。' },
        { name: 'description', label: '文章摘要／搜尋描述', widget: 'text' },
        { name: 'readMinutes', label: '閱讀時間（分鐘）', widget: 'number', value_type: 'int', min: 1, default: 5 },
        { name: 'draft', label: '草稿（開啟時不出現在網站）', widget: 'boolean', default: true, hint: '儲存會提交到 GitHub。要正式顯示文章，請關閉草稿並儲存，等待 Cloudflare 部署成功。' },
        { name: 'featuredOrder', label: '首頁精選順序', widget: 'number', value_type: 'int', min: 1, required: false, hint: '不填則不加入精選輪播。' },
        { name: 'cover', label: '封面圖片', widget: 'image', required: false },
        { name: 'coverAlt', label: '封面圖片描述', widget: 'string', required: false },
        { name: 'bodyClass', widget: 'hidden', default: '' },
        { name: 'hideEyebrow', widget: 'hidden', default: false },
        { name: 'headerVariant', widget: 'hidden', default: 'header-5703a8385bb3' },
        { name: 'footerVariant', widget: 'hidden', default: 'footer-cf4de6014b0a' },
        { name: 'body', label: '文章正文', widget: 'markdown', modes: ['raw'], hint: '使用 Markdown 編輯，可插入圖片。哈修塔特原有的 HTML 排版標籤請保留。' },
      ],
    }],
  };
  return new Response(JSON.stringify({ config, categories }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
