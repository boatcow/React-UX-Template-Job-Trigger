import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HistoricalView.css';

const API_URL = process.env.REACT_APP_API_URL;

const HistoricalView = () => {
  const navigate = useNavigate();
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    try {
      const response = await axios.get(`${API_URL}/historical_data`);
      console.log(response.data);
      setHistoricalData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Failed to load historical data');
      setLoading(false);
    }
  };

  const openGraphInNewTab = async (id, fileName) => {
    try {
      const response = await axios.get(`${API_URL}/get_html`, {
        params: {
          id: id,
          file_name: fileName
        }
      });

      if (response.data) {
        // Create a new window with the HTML content
        const newWindow = window.open();
        newWindow.document.write(response.data);
        newWindow.document.close();
      } else {
        alert('Graph does not exist.');
      }
    } catch (error) {
      console.error('Error loading graph:', error);
      alert('Graph does not exist.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="historical-view">      
      <table>
        <thead>
          <tr>
            <th>Created Time</th>
            <th>Namespace</th>
            <th>Pod</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {historicalData.map((item, index) => (
            <tr key={index}>
              <td>{new Date(item.created_time).toLocaleString()}</td>
              <td>{item.namespace}</td>
              <td>{item.pod_name}</td>
              <td>
                <button 
                  onClick={() => openGraphInNewTab(item.id, item.file_name)}
                  className="view-graph-btn"
                >
                  View Graph
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoricalView; 