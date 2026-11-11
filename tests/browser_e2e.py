"""Optional browser smoke test: python tests/browser_e2e.py (requires Playwright + Chromium)."""
from playwright.sync_api import sync_playwright
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
from tempfile import TemporaryDirectory
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        html = '<!doctype html><html><body style="margin:0"><div style="height:500px;background:red">HEADER</div><div style="height:500px;background:blue">BOTTOM</div></body></html>'
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    def log_message(self, *_): pass

server = HTTPServer(('127.0.0.1', 0), Handler)
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with TemporaryDirectory(prefix='screenshot-e2e-') as user_data, sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data, executable_path='/usr/bin/chromium', headless=True,
            args=[f'--disable-extensions-except={ROOT}',f'--load-extension={ROOT}','--no-sandbox'],
            viewport={'width': 800,'height':600}, accept_downloads=True)
        try:
            worker = context.service_workers[0] if context.service_workers else context.wait_for_event('serviceworker',timeout=12000)
            page = context.new_page()
            page.goto(f'http://127.0.0.1:{server.server_port}/')
            tab_id = worker.evaluate("async () => (await chrome.tabs.query({})).find(t => t.url?.startsWith('http://127.0.0.1:'))?.id")
            assert tab_id, 'No HTTP source tab'
            response = worker.evaluate("async tabId => chrome.runtime.sendMessage({type:'START', mode:'visible', tabId})",tab_id)
            assert response['ok'], response
            try:
                popup = context.wait_for_event('page',predicate=lambda page:'editor.html' in page.url,timeout=12000)
            except Exception:
                popup = next((page for page in context.pages if 'editor.html' in page.url),None)
            assert popup,'No popup page'
            popup.locator('#preview:not([hidden])').wait_for(timeout=8000)
            assert popup.locator('#notice').inner_text().startswith('Bereit')
            popup.locator('#zoom-in').click()
            assert popup.locator('#zoom-value').inner_text() != '100%'
            popup.locator('#fit').click()
            print('PASS: chromium extension loaded; visible capture, popup, zoom and fit')
        finally:
            context.close()
finally:
    server.shutdown()
