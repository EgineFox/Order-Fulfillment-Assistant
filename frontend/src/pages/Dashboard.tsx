import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { filesAPI, routesAPI, storesAPI } from '../services/api';
import type { DeliveryRoute, Store } from '../types';



export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);

  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [excludedStores, setExcludedStores] = useState<number[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load delivery routes and stores
  useEffect(() => {
    const loadRoutesAndStores = async () => {
      try {
        const [routesResponse, storesResponse] = await Promise.all([
          routesAPI.getAll(),
          storesAPI.getAll(),
        ]);

        setRoutes(routesResponse.routes);
        setStores(storesResponse.stores);
      } catch (err) {
        console.error('Failed to load routes or stores:', err);
      } finally {
        setLoadingRoutes(false);
      }
    };

    loadRoutesAndStores();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (!validTypes.includes(file.type)) {
        setError('Please select an Exel file (.xlsx, .xls, .csv');
        return;
      }

      setSelectedFile(file);
      setError('');
      setUploadedFileId(null);

    }
  };

  // Upload file to server
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const response = await filesAPI.upload(selectedFile);
      setUploadedFileId(response.fileId);
      console.log('File uploaded:', response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Process uploaded file
  const handleProcess = async () => {
    if (!uploadedFileId) {
      setError('Please upload a file first');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await filesAPI.process(uploadedFileId, excludedStores);
      console.log('File processed:', response);

      // Navigate to results page with data
      navigate('/results', { state: { results: response } });

    } catch (err: any) {
      setError(err.response?.data?.error || 'Processing failed');

    } finally {
      setProcessing(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get day name
  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  // Get today's day of week
  const today = new Date().getDay();


  // Format route stores whith names
  const formatRouteStores = (storesString: string): string => {
    const storeIds = storesString.split(',').map(s => parseInt(s.trim(), 10));
    return storeIds
      .map(id => {
        const store = stores.find(s => s.id === id);
        return store ? `${store.name} (${id})` : `Store ${id}`;
      })
      .join(', ');
  };

  // Find today's route
  const todayRoute = routes.find(r => r.dayOfWeek === today && r.isActive);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Order Fulfillment System</h1>
          <p>Welcome, {user?.name || user?.email}!</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
        }}>
          {error}
        </div>
      )}

      {/* Upload section */}
      <div style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '20px',
      }}>
        <h2>Upload Excel File</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Select an Excel file with order data (.xlsx, .xls, .csv)
        </p>

        {/* File input */}
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          style={{ marginBottom: '20px' }}
        />

        {/* Selected file display */}
        {selectedFile && (
          <div style={{
            padding: '10px',
            backgroundColor: '#e7f3ff',
            borderRadius: '4px',
            marginBottom: '20px',
          }}>
            <strong>Selected file:</strong> {selectedFile.name}
            <br />
            <small>Size: {(selectedFile.size / 1024).toFixed(2)} KB</small>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          style={{
            padding: '12px 30px',
            backgroundColor: selectedFile && !uploading ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            marginRight: '10px',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>

        {/* Process button */}
        {uploadedFileId && (
          <button
            onClick={handleProcess}
            disabled={processing}
            style={{
              padding: '12px 30px',
              backgroundColor: processing ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {processing ? 'Processing...' : 'Process File'}
          </button>
        )}
      </div>

      {/* Success message */}
      {uploadedFileId && !processing && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
        }}>
          File uploaded successfully! Click "Process File" to analyze the data.
        </div>
      )}

      {/* Store Exclusion Settings */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffc107',
      }}>
        <h3>⚙️ Distribution Settings</h3>
        <p style={{ fontSize: '14px', color: '#856404', marginBottom: '15px' }}>
          Select stores to <strong>EXCLUDE</strong> from distribution (they will not receive orders):
        </p>

        {loadingRoutes ? (
          <p>Loading stores...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px',
          }}>
            {stores
              .filter(s => ![1, 69, 70, 79].includes(s.id))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(store => (
                <label
                  key={store.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: excludedStores.includes(store.id) ? '#f8d7da' : 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={excludedStores.includes(store.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExcludedStores([...excludedStores, store.id]);
                      } else {
                        setExcludedStores(excludedStores.filter(id => id !== store.id));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{
                    fontSize: '14px',
                    textDecoration: excludedStores.includes(store.id) ? 'line-through' : 'none',
                    color: excludedStores.includes(store.id) ? '#721c24' : 'inherit',
                  }}>
                    {store.name} ({store.id})
                  </span>
                </label>
              ))}
          </div>
        )}

        {excludedStores.length > 0 && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
          }}>
            <strong>⚠️ Excluded: {excludedStores.length} store(s)</strong>
            <br />
            <button
              onClick={() => setExcludedStores([])}
              style={{
                marginTop: '8px',
                padding: '5px 10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Clear All Exclusions
            </button>
          </div>
        )}
      </div>

      {/* Delivery Routes Calendar */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
      }}>
        <h3>📅 Delivery Routes</h3>

        {loadingRoutes ? (
          <p>Loading routes...</p>
        ) : (
          <>
            {/* Today's Route Highlight */}
            {todayRoute && (
              <div style={{
                padding: '15px',
                marginBottom: '20px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
              }}>
                <strong>🚚 Today ({getDayName(today)}):</strong>
                <br />
                {formatRouteStores(todayRoute.stores)}
              </div>
            )}

            {/* Full Week Calendar */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Day</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Priority Stores</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const route = routes.find(r => r.dayOfWeek === day);
                  const isToday = day === today;

                  return (
                    <tr
                      key={day}
                      style={{
                        backgroundColor: isToday ? '#fff3cd' : 'white',
                        fontWeight: isToday ? 'bold' : 'normal',
                      }}
                    >
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        {getDayName(day)} {isToday && '(Today)'}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                        {route && route.isActive
                          ? formatRouteStores(route.stores)
                          : 'No route configured'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p style={{
              marginTop: '15px',
              fontSize: '14px',
              color: '#6c757d',
            }}>
              * Items will be prioritized to stores on the delivery route for the selected date
            </p>
          </>
        )}
        {/* Instructions */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}>
          <h3>How to use:</h3>
          <ol style={{ paddingLeft: '20px' }}>
            <li>Select an Excel file with order data</li>
            <li>Click "Upload File" to upload to server</li>
            <li>Click "Process File" to run distribution algorithm</li>
            <li>View results with store allocations</li>
          </ol>
        </div>
      </div>
    </div>
  )
}