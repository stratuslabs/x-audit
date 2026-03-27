export async function publish(html, handle, guiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (guiKey) headers['x-api-key'] = guiKey;

  const body = {
    html,
    title: `@${handle}'s X Network Analysis — x-audit`,
  };
  if (guiKey) body.expires = '30d';

  const res = await fetch('https://gui.new/api/canvas', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`gui.new API returned ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.url;
}
