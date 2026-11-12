"""Real Chromium preview UI test with mocked Chrome storage; NOT an extension capture E2E test."""
from playwright.sync_api import sync_playwright
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
from pathlib import Path
from io import BytesIO
from PIL import Image
import base64
import json
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    output=BytesIO();Image.new('RGB',(240,160),'#3c86a5').save(output,format='PNG')
    data='data:image/png;base64,'+base64.b64encode(output.getvalue()).decode()
    identifier='00000000-0000-4000-8000-000000000001'
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':920,'height':680})
        page.add_init_script("window.chrome={storage:{local:{get:async key=>({[key]:{data:" + json.dumps(data) + ",created:Date.now(),mode:'visible'}}),remove:async()=>{}}}};")
        page.goto(f'http://127.0.0.1:{server.server_port}/src/editor/editor.html?id={identifier}')
        page.locator('#preview:not([hidden])').wait_for(timeout=5000)
        assert page.locator('#notice').inner_text().startswith('Bereit')
        assert page.locator('#zoom-value').inner_text()=='100%'
        stage=page.locator('#viewport'); r=stage.bounding_box()
        page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2)
        page.mouse.down();page.mouse.move(r['x']+r['width']-4,r['y']+r['height']-4,steps=10);page.mouse.up()
        rect=page.locator('#preview').bounding_box()
        assert rect['x']+rect['width']<=r['x']+r['width']+1, (rect,r)
        assert rect['y']+rect['height']<=r['y']+r['height']+1, (rect,r)
        page.locator('#zoom-in').click()
        assert page.locator('#zoom-value').inner_text()=='125%'
        page.locator('#fit').click()
        assert page.locator('#zoom-value').inner_text()=='100%'
        page.locator('#actual').click()
        page.set_viewport_size({'width':500,'height':420})
        page.locator('#fit').click()
        assert not page.locator('#save').is_disabled()
        page.screenshot(path='/mnt/data/SCREENSHOT-v1.3.0-preview-test.png')
        print('PASS: Chromium UI - image load, pan bounds, zoom, fit, resize, controls')
        browser.close()
finally:
    server.shutdown()
