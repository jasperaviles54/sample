import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRModal({ title, subtitle, url, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    const safe = (title || 'survey-qr').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    link.download = `${safe}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function printQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) return;
    w.document.write(`
      <!doctype html>
      <html><head><title>${escapeHtml(title)}</title>
      <style>
        body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 32px; }
        h1 { margin: 0 0 4px; font-size: 22px; }
        p { color: #6b7280; margin: 0 0 24px; }
        img { width: 320px; height: 320px; }
        .url { font-size: 11px; color: #6b7280; margin-top: 16px; word-break: break-all; }
      </style></head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        <img src="${dataUrl}" alt="QR" />
        <div class="url">${escapeHtml(url)}</div>
        <script>window.onload = () => { window.print(); };<\/script>
      </body></html>
    `);
    w.document.close();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // ignore
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {subtitle && <p className="modal-sub">{subtitle}</p>}
        <div className="qr-frame">
          <QRCodeCanvas
            ref={canvasRef}
            value={url}
            size={220}
            level="M"
            marginSize={1}
          />
        </div>
        <div className="url-line">{url}</div>
        <div className="modal-actions">
          <button className="btn" onClick={download}>Download PNG</button>
          <button className="btn btn-ghost" onClick={printQR}>Print</button>
          <button className="btn btn-ghost" onClick={copy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
