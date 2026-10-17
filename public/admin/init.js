(async () => {
  const status = document.getElementById('cms-status');
  try {
    const response = await fetch('/admin/config.json');
    if (!response.ok) throw new Error('無法載入後台設定。');
    const { config, categories } = await response.json();
    if (!window.CMS) throw new Error('後台程式載入失敗，請確認網路連線後重新整理。');
    config.backend.base_url = location.origin;
    config.backend.site_domain = location.hostname;
    config.site_url = location.origin;
    config.display_url = location.origin;
    CMS.registerEventListener({
      name: 'preSave',
      handler: ({ entry }) => {
        let data = entry.get('data');
        const category = categories.find(item => item.id === data.get('category'));
        if (!category?.groups.some(group => group.items.some(item => item[0] === data.get('subcategory')))) {
          throw new Error('主分類與子分類不相符，請重新選擇。');
        }
        for (const name of ['featuredOrder', 'cover']) {
          if (data.get(name) === '' || data.get(name) == null) data = data.delete(name);
        }
        return data;
      },
    });
    CMS.init({ config });
    status.remove();
  } catch (error) {
    status.textContent = error.message;
  }
})();
