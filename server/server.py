from flask import Flask, jsonify, request, send_file, abort
from flask_cors import CORS  # Import CORS to handle cross-origin requests
import os
import json
import uuid
import datetime
from db_utils import init_db, create_task, update_task_status, get_task, get_db, get_historical_data

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define the base directory for output files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

# Initialize database when server starts
init_db()

@app.route('/current_task/status', methods=['GET'])
def get_task_status():
    task_id = request.args.get('id')
    
    if not task_id:
        return jsonify({
            "error": "Missing task ID"
        }), 400
    
    task = get_task(task_id)
    if not task:
        return jsonify({
            "error": "Task not found"
        }), 404
    
    monitoring_id, namespace, pod_name, status, html_file, profiling_time, created_at = task
    print("task: ", task)
    return jsonify({
        "status": status,
        "id": task_id,
        "file_name": html_file.replace('.html', '') if html_file else None
    })

@app.route('/profiling/start', methods=['POST'])
def start_profiling():
    data = request.get_json()
    id = str(uuid.uuid4())
    
    # Create directory for this profile
    profile_dir = os.path.join(OUTPUT_DIR, id)
    os.makedirs(profile_dir, exist_ok=True)
    
    # Save metadata
    metadata = {
        'created_time': datetime.datetime.now().isoformat(),
        'namespace': data.get('namespace'),
        'pod': data.get('pod'),
        'profiling_time': data.get('profiling_time')
    }
    
    with open(os.path.join(profile_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f)
    
    # Create task in database with all required parameters
    create_task(
        task_id=id,
        namespace=data.get('namespace'),
        pod_name=data.get('pod'),  # Changed from 'pod' to 'pod_name' to match db schema
    )
    
    return jsonify({
        "id": id,
        "status": "started",
        **metadata
    })

@app.route('/get_html', methods=['GET'])
def get_html_content():
    try:
        # Get parameters from query string
        id = request.args.get('id')
        file_name = request.args.get('file_name')
        
        if not id or not file_name:
            return jsonify({
                "error": "Missing required parameters"
            }), 400
            
        # Construct the absolute file path
        file_path = os.path.join(OUTPUT_DIR, id, f"{file_name}.html")
        
        print(f"Looking for file at: {file_path}")  # Debug log
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({
                "error": f"File not found at {file_path}"
            }), 404
            
        # Return the file content
        return send_file(
            file_path, 
            mimetype='text/html',
            as_attachment=False
        )
        
    except Exception as e:
        print(f"Error reading file: {str(e)}")  # Debug log
        return jsonify({
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/historical_data', methods=['GET'])
def historical_data():
    try:
        data = get_historical_data()
        return jsonify(data)
    except Exception as e:
        print("Error: ", e)
        return jsonify({
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/namespaces', methods=['GET'])
def get_namespaces():
    # Static list of namespaces for demonstration
    namespaces = ['default-namespace1', 'default-namespace2', 'default-namespace3']
    return jsonify(namespaces)

@app.route('/pods', methods=['GET'])
def get_pods():
    # Static list of pods for demonstration
    pods = ['default-pod1', 'default-pod2', 'default-pod3']
    return jsonify(pods)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True) 