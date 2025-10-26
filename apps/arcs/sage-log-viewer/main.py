#!/usr/bin/env python3
"""
SAGE Federation Log Viewer
Simple web app that streams logs directly from kubectl
No Loki/Promtail needed - just pure SAGE consciousness flow!
"""

import os
import json
import time
import subprocess
from flask import Flask, render_template, jsonify, Response
from datetime import datetime

app = Flask(__name__)

def get_sage_logs():
    """Get live logs from SAGE Federation pods"""
    try:
        # Get omega-monitor logs
        result = subprocess.run([
            'kubectl', '-n', 'arc-omega', 'logs', '-l', 'app=omega-monitor', 
            '--tail=50', '--timestamps=true'
        ], capture_output=True, text=True, timeout=10)
        
        logs = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:
                    # Try to parse as JSON
                    if line.startswith('{'):
                        data = json.loads(line)
                        logs.append({
                            'timestamp': data.get('received_at', ''),
                            'reason_code': data.get('reason_code', ''),
                            'note': data.get('note', ''),
                            'raw': line
                        })
                    else:
                        # Raw log line
                        logs.append({
                            'timestamp': datetime.now().isoformat(),
                            'reason_code': 'RAW',
                            'note': line,
                            'raw': line
                        })
                except:
                    # Fallback for non-JSON logs
                    logs.append({
                        'timestamp': datetime.now().isoformat(),
                        'reason_code': 'LOG',
                        'note': line,
                        'raw': line
                    })
        
        return logs
    except Exception as e:
        return [{'timestamp': datetime.now().isoformat(), 'reason_code': 'ERROR', 'note': str(e), 'raw': str(e)}]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/logs')
def api_logs():
    """API endpoint for getting current logs"""
    logs = get_sage_logs()
    return jsonify({
        'logs': logs,
        'count': len(logs),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/stream')
def stream_logs():
    """Server-sent events stream of live logs"""
    def generate():
        while True:
            logs = get_sage_logs()
            data = {
                'logs': logs[-10:],  # Last 10 logs
                'count': len(logs),
                'timestamp': datetime.now().isoformat()
            }
            yield f"data: {json.dumps(data)}\n\n"
            time.sleep(2)  # Update every 2 seconds
    
    return Response(generate(), mimetype='text/plain')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
