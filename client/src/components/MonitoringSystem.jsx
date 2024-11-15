import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MonitoringSystem.css';

const API_URL = process.env.REACT_APP_API_URL;

const MonitoringSystem = () => {
  const navigate = useNavigate();
  const [namespace, setNamespace] = useState('');
  const [pod, setPod] = useState('');
  const [profilingTime, setProfilingTime] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(null);
  const [monitoringId, setMonitoringId] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [namespaceList, setNamespaceList] = useState([]);
  const [podList, setPodList] = useState([]);

  // Poll status when monitoring is running
  useEffect(() => {
    let intervalId;

    if (isRunning && monitoringId) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`${API_URL}/current_task/status`, {
            params: {
              id: monitoringId
            }
          });
          const { status, id, file_name } = response.data;
          
          setStatus(status);
          setMonitoringId(id);
          setFileName(file_name);

          if (status === 'done') {
            setIsRunning(false);
            const htmlResponse = await axios.get(`${API_URL}/get_html`, {
              params: {
                id: id,
                file_name: file_name
              }
            });
            setHtmlContent(htmlResponse.data);
          }
        } catch (error) {
          console.error('Error fetching status:', error);
          setIsRunning(false);
          setErrorMessage('Failed to fetch status. Please try again.');
        }
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, monitoringId]);

  const startMonitoring = async () => {
    try {
      const response = await axios.post(`${API_URL}/profiling/start`, {
        namespace: namespace,
        pod: pod,
        profiling_time: profilingTime
      });
      setIsRunning(true);
      setMonitoringId(response.data.id);
      setErrorMessage('');
    } catch (error) {
      console.error('Error starting monitoring:', error);
      setErrorMessage('Failed to start monitoring. Please check your inputs.');
    }
  };

  useEffect(() => {
    // Example fetch function
    const fetchNamespacesAndPods = async () => {
      try {
        const namespaceResponse = await axios.get(`${API_URL}/namespaces`);
        setNamespaceList(namespaceResponse.data);

        const podResponse = await axios.get(`${API_URL}/pods`);
        setPodList(podResponse.data);
      } catch (error) {
        console.error('Error fetching namespaces or pods:', error);
      }
    };

    fetchNamespacesAndPods();
  }, []);

  return (
    <div className="monitoring-system">
      <div className="monitoring-form">
        
        <div className="form-row">
          <div className="form-group">
            <select
              id="namespace"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className={namespace ? '' : 'input-error'}
            >
              <option value="" disabled>Select Namespace</option>
              {namespaceList.map((ns) => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <select
              id="pod"
              value={pod}
              onChange={(e) => setPod(e.target.value)}
              className={pod ? '' : 'input-error'}
            >
              <option value="" disabled>Select Pod</option>
              {podList.map((pod) => (
                <option key={pod} value={pod}>{pod}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group profiling-time">
          <div className="time-input-wrapper">
            <input
              id="profilingTime"
              type="range"
              min="1"
              max="60"
              value={profilingTime}
              onChange={(e) => setProfilingTime(parseInt(e.target.value))}
            />
            <div className="time-display">
              {profilingTime} Profiling seconds
            </div>
          </div>
        </div>

        <button 
          onClick={startMonitoring}
          disabled={isRunning || !namespace || !pod || profilingTime > 60}
          className={`start-button ${isRunning ? 'button-loading' : ''}`}
        >
          {isRunning ? (
            <>
              <span className="spinner"></span>
              Job in Progress...
            </>
          ) : (
            'Start Task'
          )}
        </button>
      </div>

      {isRunning && (
        <div className="status-display">
          <div className="loading-spinner" />
          <p>Status: {status}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error-display">
          <p>{errorMessage || 'An error occurred while fetching results'}</p>
        </div>
      )}

      {htmlContent && (
        <div 
          className="result-display"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  );
};

export default MonitoringSystem; 