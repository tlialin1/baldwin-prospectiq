import http.server
import socketserver
import os
import json

PORT = int(os.environ.get('PORT', 3000))

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {'status': 'ok', 'service': 'baldwin-prospectiq-backend'}
        self.wfile.write(json.dumps(response).encode())

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Server running on port {PORT}")
    httpd.serve_forever()
