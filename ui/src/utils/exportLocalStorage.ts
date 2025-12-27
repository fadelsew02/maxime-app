export function exportLocalStorageToJSON(): void {
  const data: Record<string, any> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      try {
        data[key] = JSON.parse(value || '');
      } catch {
        data[key] = value;
      }
    }
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `localstorage_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function addExportButton(): void {
  const button = document.createElement('button');
  button.textContent = '📥 Exporter localStorage';
  button.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 20px;background:#003366;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold';
  button.onclick = () => {
    exportLocalStorageToJSON();
    alert('Fichier téléchargé!');
  };
  document.body.appendChild(button);
}
