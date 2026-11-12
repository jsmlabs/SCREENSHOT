"""Chromium UI test with mocked local storage. Tests editor interactions, not extension capture APIs."""
from playwright.sync_api import sync_playwright
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
from io import BytesIO
from PIL import Image
import base64, json
ROOT=Path(__file__).resolve().parent.parent
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
    output=BytesIO();Image.new('RGB',(400,300),'#3c86a5').save(output,format='PNG')
    data='data:image/png;base64,'+base64.b64encode(output.getvalue()).decode()
    identifier='00000000-0000-4000-8000-000000000001'
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':900,'height':700},accept_downloads=True)
        page.add_init_script("window.chrome={storage:{local:{get:async key=>({[key]:{data:" + json.dumps(data) + ",created:Date.now(),mode:'visible'}})}}};")
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/src/editor/editor.html?id={identifier}')
        page.locator('#preview:not([hidden])').wait_for()
        assert '400 × 300' in page.locator('#notice').inner_text()
        assert page.locator('#undo').is_disabled()
        viewport=page.locator('#viewport')
        box=viewport.bounding_box()
        # Fit initially 100%, image is centered within stage. Draw relative to img box.
        page.locator('[data-tool="rect"]').click()
        image_box=page.locator('#preview').bounding_box()
        page.mouse.move(image_box['x']+40,image_box['y']+40)
        page.mouse.down();page.mouse.move(image_box['x']+180,image_box['y']+130,steps=8);page.mouse.up()
        page.wait_for_timeout(150)
        assert '1 Annotationen' in page.locator('#notice').inner_text(),page.locator('#notice').inner_text()
        assert not page.locator('#undo').is_disabled()
        edited_src=page.locator('#preview').get_attribute('src')
        assert edited_src!=data
        page.locator('#undo').click()
        assert '0 Annotationen' in page.locator('#notice').inner_text()
        page.locator('#redo').click()
        assert '1 Annotationen' in page.locator('#notice').inner_text()
        page.locator('[data-tool="crop"]').click()
        image_box=page.locator('#preview').bounding_box()
        page.mouse.move(image_box['x']+20,image_box['y']+25)
        page.mouse.down();page.mouse.move(image_box['x']+250,image_box['y']+210,steps=10);page.mouse.up()
        page.wait_for_timeout(150)
        assert '230 × 185' in page.locator('#notice').inner_text(),page.locator('#notice').inner_text()
        assert page.locator('[data-tool="pan"]').get_attribute('aria-pressed')=='true'
        with page.expect_download() as info:page.locator('#save').click()
        download=info.value
        assert download.suggested_filename.endswith('.png')
        saved=Path('/mnt/data/SCREENSHOT-v1.4.0-export-test.png');download.save_as(saved)
        exported=Image.open(saved)
        assert exported.size==(230,185),exported.size
        page.locator('#undo').click()
        assert '400 × 300' in page.locator('#notice').inner_text()
        page.locator('#reset-edit').click()
        assert '0 Annotationen' in page.locator('#notice').inner_text()
        page.locator('#zoom-in').click()
        assert page.locator('#zoom-value').inner_text()=='125%'
        page.screenshot(path='/mnt/data/SCREENSHOT-v1.4.0-preview-test.png')
        assert not errors,errors
        print('PASS Chromium UI: annotate, preview render, undo, redo, crop, PNG dimensions, reset, zoom; no page errors')
        browser.close()
finally:
    server.shutdown()
