import os
import sqlite3
from contextlib import contextmanager

DB_FILE = 'monitoring.db'

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_FILE)
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS monitoring_tasks (
                id TEXT PRIMARY KEY,
                namespace TEXT NOT NULL,
                pod_name TEXT NOT NULL,
                status TEXT NOT NULL,
                html_file TEXT,
                profiling_time FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

def create_task(task_id, namespace, pod_name, status='running'):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO monitoring_tasks (id, namespace, pod_name, status) 
            VALUES (?, ?, ?, ?)
        ''', (task_id, namespace, pod_name, status))
        conn.commit()

def update_task_status(task_id, status, html_file=None, profiling_time=None):
    with get_db() as conn:
        cursor = conn.cursor()
        if html_file and profiling_time:
            cursor.execute('''
                UPDATE monitoring_tasks 
                SET status = ?, html_file = ?, profiling_time = ? 
                WHERE id = ?
            ''', (status, html_file, profiling_time, task_id))
        elif html_file:
            cursor.execute('''
                UPDATE monitoring_tasks 
                SET status = ?, html_file = ? 
                WHERE id = ?
            ''', (status, html_file, task_id))
        else:
            cursor.execute('''
                UPDATE monitoring_tasks 
                SET status = ? 
                WHERE id = ?
            ''', (status, task_id))
        conn.commit()

def get_task(task_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                id, namespace, pod_name, status, html_file, profiling_time, created_at 
            FROM monitoring_tasks 
            WHERE id = ?
        ''', (task_id,))
        return cursor.fetchone()

def get_historical_data():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                id, namespace, pod_name, status, html_file, profiling_time, created_at 
            FROM monitoring_tasks 
            ORDER BY created_at DESC
            LIMIT 15
        ''')
        rows = cursor.fetchall()
        return [
            {
                "id": row[0],
                "namespace": row[1],
                "pod_name": row[2],
                "status": row[3],
                "html_file": row[4],
                "profiling_time": row[5],
                "created_at": row[6]
            }
            for row in rows
        ]