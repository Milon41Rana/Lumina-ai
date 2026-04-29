import { GeneratedFile } from '../types';

/**
 * SandboxEngine converts a Virtual File System (VFS) into a sandboxed iframe environment.
 * It resolves local file references by creating temporary Blob URLs.
 */
export class SandboxEngine {
  private blobs: Map<string, string> = new Map();

  constructor(private files: GeneratedFile[]) {}

  /**
   * Cleans up existing blob URLs to prevent memory leaks.
   */
  public destroy() {
    this.blobs.forEach(url => URL.revokeObjectURL(url));
    this.blobs.clear();
  }

  /**
   * Generates the final srcDoc for the iframe.
   */
  public generateSrcDoc(): string {
    const mainFile = this.files.find(f => f.name === 'index.html');
    if (!mainFile) return '<html><body><h1>Error: index.html not found</h1></body></html>';

    // 1. Create blobs for all assets (CSS, JS, etc.)
    this.createBlobs();

    // 2. Resolve references in index.html
    let content = mainFile.content;

    // Resolve <script src="...">
    content = content.replace(/<script\s+([^>]*?)src=["'](.*?)["']([^>]*?)>/gi, (match, p1, p2, p3) => {
      const blobUrl = this.blobs.get(p2);
      if (blobUrl) return `<script ${p1}src="${blobUrl}"${p3}>`;
      return match;
    });

    // Resolve <link rel="stylesheet" href="...">
    content = content.replace(/<link\s+([^>]*?)href=["'](.*?)["']([^>]*?)>/gi, (match, p1, p2, p3) => {
      const blobUrl = this.blobs.get(p2);
      if (blobUrl) return `<link ${p1}href="${blobUrl}"${p3}>`;
      return match;
    });

    // Resolve <img src="...">
    content = content.replace(/<img\s+([^>]*?)src=["'](.*?)["']([^>]*?)>/gi, (match, p1, p2, p3) => {
      const blobUrl = this.blobs.get(p2);
      if (blobUrl) return `<img ${p1}src="${blobUrl}"${p3}>`;
      return match;
    });

    // 3. Inject Console Relay and Error Handling
    const relayScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;

          const send = (type, args) => {
            window.parent.postMessage({ 
              type: 'runtime_event', 
              payload: { 
                type, 
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
              } 
            }, '*');
          };

          console.log = (...args) => { send('log', args); originalLog.apply(console, args); };
          console.error = (...args) => { send('error', args); originalError.apply(console, args); };
          console.warn = (...args) => { send('warn', args); originalWarn.apply(console, args); };

          window.onerror = (msg, url, line, col, error) => {
            send('error', [\`Unhandled: \${msg} at line \${line}\`]);
            return false;
          };

          window.onunhandledrejection = (event) => {
            send('error', [\`Promise Rejection: \${event.reason}\`]);
          };

          // Monitor DOM changes for potential layout issues
          const observer = new MutationObserver((mutations) => {
             // We could send signal if body is empty after load
          });
          observer.observe(document.documentElement, { childList: true, subtree: true });
        })();
      </script>
    `;

    // Inject before </head> or at the beginning
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${relayScript}\n</head>`);
    } else {
      content = relayScript + content;
    }

    return content;
  }

  private createBlobs() {
    this.files.forEach(file => {
      if (file.name === 'index.html') return;
      
      const type = this.getMimeType(file.name);
      const blob = new Blob([file.content], { type });
      const url = URL.createObjectURL(blob);
      this.blobs.set(file.name, url);
    });
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'application/javascript';
      case 'css': return 'text/css';
      case 'json': return 'application/json';
      case 'svg': return 'image/svg+xml';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      default: return 'text/plain';
    }
  }
}
