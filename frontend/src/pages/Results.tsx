import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { ProcessFileResponse, StoreRequest, Store } from "../types";
import { storesAPI } from "../services/api";



export default function Results() {

    //Add styles for printing
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
    @media print {
  /* Hide everything */
  body * {
    visibility: hidden;
  }
  
  /* Show only print summary */
  #print-only-summary,
  #print-only-summary * {
    visibility: visible !important;
    display: block !important;
  }
  
  #print-only-summary {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  /* Hide screen version */
  #manager-report {
    display: none !important;
  }

      
      #main-warehouse-table {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        font-size: 16px;
      }
      
      #main-warehouse-table th {
        font-size: 18px !important;
        padding: 15px !important;
        background-color: #f0f0f0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      #main-warehouse-table td {
        font-size: 16px !important;
        padding: 15px !important;
      }
      
      /* Highlight location and quantity */
      #main-warehouse-table td:nth-child(3),
      #main-warehouse-table td:nth-child(4) {
        font-size: 24px !important;
        font-weight: bold !important;
      }
      
      /* Yellow background for location */
      #main-warehouse-table td:nth-child(3) {
        background-color: #fff3cd !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
        /* Manager Report Print */
     /* Show only manager report */
      #manager-report,
      #manager-report * {
        visibility: visible;
      }
      
      #manager-report {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
      }
      
      /* Compact header */
      #manager-report h1 {
        font-size: 18px !important;
        margin-bottom: 5px !important;
      }
      
      #manager-report > div:first-child {
        margin-bottom: 15px !important;
        padding-bottom: 10px !important;
      }
      
      #manager-report > div:first-child p {
        font-size: 11px !important;
        margin: 5px 0 0 0 !important;
      }
      
      /* Compact statistics cards */
      #manager-report > div:nth-child(2) {
        margin-bottom: 15px !important;
        gap: 10px !important;
      }
      
      #manager-report > div:nth-child(2) > div {
        padding: 10px !important;
      }
      
      #manager-report > div:nth-child(2) h3 {
        font-size: 11px !important;
        margin: 0 0 5px 0 !important;
      }
      
      #manager-report > div:nth-child(2) p {
        font-size: 20px !important;
        margin: 0 !important;
      }
      
      #manager-report > div:nth-child(2) p:last-child {
        font-size: 10px !important;
      }
      
      /* Compact sections */
      #manager-report > div > h2 {
        font-size: 14px !important;
        margin-bottom: 8px !important;
        padding-bottom: 5px !important;
      }
      
      /* Compact tables */
      #manager-report table {
        font-size: 10px !important;
        margin-bottom: 10px !important;
      }
      
      #manager-report th {
        padding: 5px !important;
        font-size: 9px !important;
      }
      
      #manager-report td {
        padding: 4px 5px !important;
        font-size: 10px !important;
      }
      
      /* Store requests - more compact */
      #manager-report > div:nth-child(4) > div {
        margin-bottom: 10px !important;
        padding: 8px !important;
      }
      
      #manager-report > div:nth-child(4) h3 {
        font-size: 11px !important;
        margin: 0 0 5px 0 !important;
      }
      
      /* Remove colors for printing */
      * {
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      /* Keep borders */
      #manager-report table,
      #manager-report th,
      #manager-report td {
        border: 1px solid #000 !important;
      }
      
      /* Keep important backgrounds */
      #manager-report thead tr {
        background-color: #f0f0f0 !important;
      }
      
      /* Page breaks */
      #manager-report > div {
        page-break-inside: avoid;
      }
      
      /* Fit to one page if possible */
      @page {
        size: A4;
        margin: 10mm;
      }
    }
}
  `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'main' | 'stores' | 'insufficient' | 'report'>('main');
    const [stores, setStores] = useState<Store[]>([]);
    useEffect(() => {
  const loadStores = async () => {
    try {
      const response = await storesAPI.getAll();
      setStores(response.stores);
    } catch (err) {
      console.error('Failed to load stores:', err);
    }
  };
  
  loadStores();
}, []);

    // Get results from navigation state
    const results = location.state?.results as ProcessFileResponse | undefined;

    // Group mainwarehouse items by SKU + location
    const groupedMainWarehouse = results ? results.results.mainWarehouse.reduce((acc, item) => {
        const key = `${item.sku} - ${item.locationCode || 'no-location'}-${item.warehouse}`;

        if (!acc[key]) {
            acc[key] = {
                ...item,
                orderIds: [item.orderId],
            };
        } else {
            acc[key].quantity += item.quantity;
            acc[key].orderIds.push(item.orderId);
        }

        return acc;
    }, {} as Record<string, {
        orderId: string;
        sku: string;
        productName: string;
        quantity: number;
        status: 'main_warehouse';
        warehouse?: number;
        locationCode?: string;
        orderIds: string[];
    }>) : {};

    const groupedMainWarehouseArray = Object.values(groupedMainWarehouse);

    // Group insufficient items by SKU
    const groupedInsufficient = results ? results.results.insufficient.reduce((acc, item) => {
        const key = item.sku;

        if (!acc[key]) {
            acc[key] = {
                sku: item.sku,
                productName: item.productName,
                orderIds: [item.orderId],
                totalQuantity: item.quantity,
                totalMissing: item.missingQuantity,
            };
        } else {
            // Add order ID only if it's not already in the list
            if (!acc[key].orderIds.includes(item.orderId)) {
                acc[key].orderIds.push(item.orderId);
            }
            acc[key].totalQuantity += item.quantity;
            acc[key].totalMissing += item.missingQuantity;
        }

        return acc;
    }, {} as Record<string, {
        sku: string;
        productName: string;
        orderIds: string[];
        totalQuantity: number;
        totalMissing: number;
    }>) : {};

    const groupedInsufficientArray = Object.values(groupedInsufficient);

    // If no results? redirect to dashboard
    if (!results) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>No results found</h2>
                <p>Please upload and process a file first.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}

                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    // Copy message to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Message copied to clipboard!');
    };

    // Open Whatsapp
    const openWhatsApp = (phone: string | undefined, message: string) => {
        if (!phone) {
            alert('No phone number available');
            return;
        }

        // Remove non-digits
        const cleanPhone = phone.replace(/\D/g, '');

        // Encode message for URL
        const encodeMessage = encodeURIComponent(message);

        // Open Whatsapp
        window.open(`https://wa.me/${cleanPhone}?text=${encodeMessage}`, '_blank');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/*Header*/}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1>Distribution Results</h1>
                    <p>Total rows processed: {results.totalRows}</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Parse errors */}
            {results.parseError && results.parseError.length > 0 && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px',
                }}>
                    <h3> Warning: Errors in file</h3>
                    <ul>
                        {results.parseError.map((error, idx) => (
                            <li key={idx}>
                                <strong>Row {error.row}</strong> (Order {error.externalId}): {error.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/*Tabs */}
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #dee2e6' }}>
                <button
                    onClick={() => setActiveTab('main')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'main' ? '#007bff' : 'transparent',
                        color: activeTab === 'main' ? 'white' : '#495057',
                        border: 'none',
                        borderBottom: activeTab === 'main' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                        marginRight: '10px',
                    }}>
                    Main Warehouse ({results.results.mainWarehouse.length})
                </button>
                <button
                    onClick={() => setActiveTab('stores')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'stores' ? '#007bff' : 'transparent',
                        color: activeTab === 'stores' ? 'white' : '#495057',
                        border: 'none',
                        borderBottom: activeTab === 'stores' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                        marginRight: '10px',
                    }} >
                    Store Requests ({results.results.storeRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('insufficient')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'insufficient' ? '#007bff' : 'transparent',
                        color: activeTab === 'insufficient' ? 'white' : '#495057',
                        border: 'none',
                        borderBottom: activeTab === 'insufficient' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                    }}
                >
                    Insufficient ({results.results.insufficient.length})
                </button>
                <button
                    onClick={() => setActiveTab('report')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'report' ? '#007bff' : 'transparent',
                        color: activeTab === 'report' ? 'white' : '#495057',
                        border: 'none',
                        borderBottom: activeTab === 'report' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                        marginRight: '10px',
                    }}
                >
                    📊 Manager Report
                </button>
            </div>

            {/* Main Warehouse Tab */}
            {activeTab === 'main' && (
                <div>
                    {/* Print Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Main Warehouse Orders</h2>
                        {groupedMainWarehouseArray.length > 0 && (
                            <button
                                onClick={() => window.print()}
                                className="no-print"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                }}
                            >
                                🖨️ Print for Picker
                            </button>
                        )}
                    </div>

                    {groupedMainWarehouseArray.length === 0 ? (
                        <p>No items from main warehouse.</p>
                    ) : (
                        <table
                            id="main-warehouse-table"
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginTop: '20px',
                            }}
                        >
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>SKU</th>
                                    <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Product</th>
                                    <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>LOCATION</th>
                                    <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>QUANTITY</th>
                                    <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>Warehouse</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedMainWarehouseArray.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontFamily: 'monospace' }}>{item.sku}</td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{item.productName}</td>
                                        <td style={{
                                            padding: '12px',
                                            border: '1px solid #dee2e6',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '20px',
                                            backgroundColor: item.locationCode ? '#fff3cd' : 'transparent',
                                        }}>
                                            {item.locationCode || '-'}
                                        </td>
                                        <td style={{
                                            padding: '12px',
                                            border: '1px solid #dee2e6',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '20px',
                                        }}>
                                            {item.quantity}
                                        </td>
                                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                            {item.warehouse === 1 && '1'}
                                            {item.warehouse === 69 && '69'}
                                            {item.warehouse === 70 && '70'}
                                            {item.warehouse === 79 && '79'}
                                            {!item.warehouse && '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Store Requests Tab */}
            {activeTab === 'stores' && (
                <div>
                    <h2>Store Requests</h2>
                    {results.results.storeRequests.length === 0 ? (
                        <p>No store requests.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            {results.results.storeRequests.map((store: StoreRequest) => (
                                <div
                                    key={store.storeId}
                                    style={{
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <h3 style={{ marginTop: 0 }}>{store.storeName}</h3>
                                    {store.managerPhone && (
                                        <p style={{ color: '#666', fontSize: '14px' }}>📞 {store.managerPhone}</p>
                                    )}

                                    <h4>Items ({store.items.length}):</h4>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        {store.items.map((item, idx) => (
                                            <li key={idx} style={{ marginBottom: '10px' }}>
                                                <strong>{item.productName}</strong>
                                                <br />
                                                <small>SKU: {item.sku} | Qty: {item.quantity}</small>
                                            </li>
                                        ))}
                                    </ul>

                                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                        <strong>Message:</strong>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '10px' }}>
                                            {store.messageText}
                                        </pre>
                                    </div>

                                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => copyToClipboard(store.messageText)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Copy Message
                                        </button>
                                        {store.managerPhone && (
                                            <button
                                                onClick={() => openWhatsApp(store.managerPhone, store.messageText)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    backgroundColor: '#25D366',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                WhatsApp
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Insufficient Tab */}
            {activeTab === 'insufficient' && (
                <div>
                    <h2>Insufficient Inventory</h2>
                    {groupedInsufficientArray.length === 0 ? (
                        <p style={{ color: '#28a745', fontWeight: 'bold' }}>✅ All items have sufficient inventory!</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8d7da' }}>
                                    <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'left' }}>SKU</th>
                                    <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'left' }}>Product</th>
                                    <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'left' }}>Order IDs</th>
                                    <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'center' }}>Total Needed</th>
                                    <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'center' }}>Total Missing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedInsufficientArray.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '10px', border: '1px solid #f5c6cb', fontFamily: 'monospace' }}>{item.sku}</td>
                                        <td style={{ padding: '10px', border: '1px solid #f5c6cb' }}>{item.productName}</td>
                                        <td style={{ padding: '10px', border: '1px solid #f5c6cb' }}>
                                            {item.orderIds.join(', ')}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'center' }}>{item.totalQuantity}</td>
                                        <td style={{
                                            padding: '10px',
                                            border: '1px solid #f5c6cb',
                                            textAlign: 'center',
                                            color: '#dc3545',
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                        }}>
                                            {item.totalMissing}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Print-Only Summary */}
            <div id="print-only-summary" style={{ display: 'none' }}>
                <div style={{ padding: '20px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                        <h1 style={{ margin: 0, fontSize: '18px' }}>Order Fulfillment Summary Report</h1>
                        <p style={{ margin: '5px 0 0 0', fontSize: '11px' }}>
                            {new Date().toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {/* Summary Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'center' }}>Count</th>
                                <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'left' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>Total Orders Processed</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                                    {results.totalRows}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>All items from uploaded file</td>
                            </tr>
                            <tr style={{ backgroundColor: '#f9f9f9' }}>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>✅ Main Warehouse</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                                    {results.results.mainWarehouse.length}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>Ready for immediate picking</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>📦 Store Requests</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                                    {results.results.storeRequests.reduce((sum, s) => sum + s.items.length, 0)}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>
                                    Across {results.results.storeRequests.length} stores - requires coordination
                                </td>
                            </tr>
                            <tr style={{ backgroundColor: '#ffe6e6' }}>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>❌ Insufficient Inventory</td>
                                <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                                    {groupedInsufficientArray.reduce((sum, item) => sum + item.totalMissing, 0)}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #000' }}>
                                    {groupedInsufficientArray.length} unique items - requires action
                                </td>
                            </tr>
                        </tbody>
                    </table>

 {/* Store Breakdown */}
{results.results.storeRequests.length > 0 && (
  <>
    <h3 style={{ fontSize: '14px', marginTop: '15px', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
      Store Requests Breakdown
    </h3>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '10px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f0f0f0' }}>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'left', width: '20%' }}>Store</th>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', width: '10%' }}>Items</th>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'left', width: '40%' }}>Products</th>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'left', width: '30%' }}>Alt. Sources</th>
        </tr>
      </thead>
      <tbody>
        {results.results.storeRequests.map((store, idx) => {
          // Count how many items have alternatives
          const itemsWithAlts = store.items.filter(item => {
            if (!item.availableStores) return false;
            const otherStores = item.availableStores.filter(s => 
              ![1, 69, 70, 79, store.storeId].includes(s)
            );
            return otherStores.length > 0;
          }).length;
          
          const itemsWithoutAlts = store.items.length - itemsWithAlts;
          
          return (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
              <td style={{ padding: '6px', border: '1px solid #000', fontWeight: 'bold' }}>
                {store.storeName}
              </td>
              <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                {store.items.length}
              </td>
              <td style={{ padding: '6px', border: '1px solid #000', fontSize: '9px' }}>
                {store.items.slice(0, 3).map(item => item.sku).join(', ')}
                {store.items.length > 3 && ` +${store.items.length - 3} more`}
              </td>
              <td style={{ padding: '6px', border: '1px solid #000', fontSize: '9px' }}>
                {itemsWithAlts > 0 && (
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                    ✓ {itemsWithAlts} item{itemsWithAlts > 1 ? 's' : ''} available elsewhere
                  </span>
                )}
                {itemsWithoutAlts > 0 && (
                  <span style={{ color: '#dc3545' }}>
                    {itemsWithAlts > 0 && ' | '}
                    ✗ {itemsWithoutAlts} unique
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    
    {/* Detailed breakdown - only for stores with many items */}
    {results.results.storeRequests.filter(s => s.items.length > 5).map((store) => (
      <div key={store.storeId} style={{ marginBottom: '10px', fontSize: '9px', pageBreakInside: 'avoid' }}>
        <strong>{store.storeName} - Detailed List:</strong>
        <div style={{ paddingLeft: '10px', marginTop: '3px' }}>
          {store.items.map((item, idx) => {
            const otherStores = item.availableStores 
              ? item.availableStores.filter(s => ![1, 69, 70, 79, store.storeId].includes(s))
              : [];
            
            const altStoreNames = otherStores.length > 0
              ? otherStores.slice(0, 2).map(storeId => {
                  const storeData = stores.find(s => s.id === storeId);
                  return storeData?.name || `Store ${storeId}`;
                }).join(', ') + (otherStores.length > 2 ? ` +${otherStores.length - 2}` : '')
              : 'None';
            
            return (
              <div key={idx} style={{ padding: '2px 0' }}>
                • {item.sku} - {item.productName.substring(0, 40)}
                {item.productName.length > 40 && '...'}
                {otherStores.length > 0 && (
                  <span style={{ color: '#666', fontStyle: 'italic' }}> (Alt: {altStoreNames})</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </>
)}
                    {/* Insufficient Items */}
{groupedInsufficientArray.length > 0 && (
  <>
    <h3 style={{ fontSize: '14px', marginTop: '15px', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
      ⚠️ ACTION REQUIRED: Insufficient Inventory
    </h3>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
      <thead>
        <tr style={{ backgroundColor: '#ffe6e6' }}>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'left' }}>SKU</th>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'left' }}>Product</th>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'left' }}>Orders</th>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'center' }}>Missing</th>
          <th style={{ padding: '6px', border: '1px solid #000', textAlign: 'left' }}>Available In</th>
        </tr>
      </thead>
      <tbody>
        {groupedInsufficientArray.map((item, idx) => {
            
          // Get available stores from first insufficient item with this SKU
          const insufficientItem = results.results.insufficient.find(i => i.sku === item.sku);
          const availableStores = insufficientItem?.availableStores || [];
          
          // Filter out main warehouses
          const otherStores = availableStores.filter(s => ![1, 69, 70, 79].includes(s));
          
          // Get store names
          const storeNames = otherStores.map(storeId => {
            const storeData = stores.find(s => s.id === storeId);
            return storeData ? storeData.name : `Store ${storeId}`;
          }).join(', ');
          
          return (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fff9f9' }}>
              <td style={{ padding: '6px', border: '1px solid #000', fontFamily: 'monospace' }}>{item.sku}</td>
              <td style={{ padding: '6px', border: '1px solid #000' }}>{item.productName}</td>
              <td style={{ padding: '6px', border: '1px solid #000' }}>{item.orderIds.join(', ')}</td>
              <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                {item.totalMissing}
              </td>
              <td style={{ padding: '6px', border: '1px solid #000', fontSize: '9px' }}>
                {otherStores.length > 0 ? storeNames : '❌ Nowhere (Out of stock)'}
              </td>
              <td style={{ padding: '6px', border: '1px solid #000', fontSize: '9px' }}>
  {(() => {
    const insufficientItem = results.results.insufficient.find(i => i.sku === item.sku);
    const availableStores = insufficientItem?.availableStores || [];
    const otherStores = availableStores.filter(s => ![1, 69, 70, 79].includes(s));
    
    if (otherStores.length === 0) {
      return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ Out of stock</span>;
    }
    
    const storeNames = otherStores.slice(0, 3).map(storeId => {
      const storeData = stores.find(s => s.id === storeId);
      return storeData?.name || `Store ${storeId}`;
    }).join(', ');
    
    return (
      <span>
        {storeNames}
        {otherStores.length > 3 && ` +${otherStores.length - 3} more`}
      </span>
    );
  })()}
</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </>
)}
                </div>
            </div>

            {/* Manager Report Tab */}
            {activeTab === 'report' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Manager Report</h2>
                        <button
                            onClick={() => window.print()}
                            className="no-print"
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            🖨️ Print Report
                        </button>
                    </div>

                    <div id="manager-report" style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6',
                    }}>

                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
                            <h1 style={{ margin: 0, fontSize: '28px' }}>Order Fulfillment Report</h1>
                            <p style={{ margin: '10px 0 0 0', color: '#666' }}>
                                Generated: {new Date().toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {/* Summary Statistics */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px',
                            marginBottom: '30px',
                        }}>
                            <div style={{
                                padding: '20px',
                                backgroundColor: '#e7f3ff',
                                borderRadius: '8px',
                                textAlign: 'center',
                            }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Orders</h3>
                                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
                                    {results.totalRows}
                                </p>
                            </div>

                            <div style={{
                                padding: '20px',
                                backgroundColor: '#d4edda',
                                borderRadius: '8px',
                                textAlign: 'center',
                            }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Main Warehouse</h3>
                                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                                    {results.results.mainWarehouse.length}
                                </p>
                            </div>

                            <div style={{
                                padding: '20px',
                                backgroundColor: '#fff3cd',
                                borderRadius: '8px',
                                textAlign: 'center',
                            }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Store Requests</h3>
                                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
                                    {results.results.storeRequests.reduce((sum, store) => sum + store.items.length, 0)}
                                </p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                                    ({results.results.storeRequests.length} stores)
                                </p>
                            </div>

                            <div style={{
                                padding: '20px',
                                backgroundColor: '#f8d7da',
                                borderRadius: '8px',
                                textAlign: 'center',
                            }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Insufficient</h3>
                                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>
                                    {results.results.insufficient.reduce((sum, item) => sum + item.missingQuantity, 0)}
                                </p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                                    ({results.results.insufficient.length} items)
                                </p>
                            </div>
                        </div>

                        {/* Main Warehouse Section */}
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{
                                fontSize: '20px',
                                marginBottom: '15px',
                                paddingBottom: '10px',
                                borderBottom: '2px solid #28a745',
                            }}>
                                ✅ Main Warehouse Items ({results.results.mainWarehouse.length})
                            </h2>

                            {results.results.mainWarehouse.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No items from main warehouse</p>
                            ) : (
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '14px',
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>SKU</th>
                                            <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Product</th>
                                            <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Qty</th>
                                            <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Warehouse</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.results.mainWarehouse.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{item.sku}</td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>{item.productName}</td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                    {item.warehouse}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Store Requests Section */}
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{
                                fontSize: '20px',
                                marginBottom: '15px',
                                paddingBottom: '10px',
                                borderBottom: '2px solid #ffc107',
                            }}>
                                📦 Store Requests ({results.results.storeRequests.length} stores, {results.results.storeRequests.reduce((sum, s) => sum + s.items.length, 0)} items)
                            </h2>

                            {results.results.storeRequests.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No store requests</p>
                            ) : (
                                results.results.storeRequests.map((store) => (
                                    <div key={store.storeId} style={{
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        border: '1px solid #dee2e6',
                                    }}>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                            {store.storeName} (Store {store.storeId})
                                        </h3>

                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: '13px',
                                            backgroundColor: 'white',
                                        }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#e9ecef' }}>
                                                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Order ID</th>
                                                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>SKU</th>
                                                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Product</th>
                                                    <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {store.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ padding: '6px', border: '1px solid #dee2e6' }}>{item.orderId}</td>
                                                        <td style={{ padding: '6px', border: '1px solid #dee2e6' }}>{item.sku}</td>
                                                        <td style={{ padding: '6px', border: '1px solid #dee2e6' }}>{item.productName}</td>
                                                        <td style={{ padding: '6px', border: '1px solid #dee2e6', textAlign: 'center' }}>{item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Insufficient Section */}
                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={{
                                fontSize: '20px',
                                marginBottom: '15px',
                                paddingBottom: '10px',
                                borderBottom: '2px solid #dc3545',
                            }}>
                                ❌ Insufficient Inventory ({groupedInsufficientArray.length} unique items, {groupedInsufficientArray.reduce((sum, item) => sum + item.totalMissing, 0)} units missing)
                            </h2>

                            {groupedInsufficientArray.length === 0 ? (
                                <p style={{ color: '#28a745', fontWeight: 'bold' }}>✅ All items have sufficient inventory!</p>
                            ) : (
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '14px',
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8d7da' }}>
                                            <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'left' }}>SKU</th>
                                            <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'left' }}>Product</th>
                                            <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'left' }}>Affected Orders</th>
                                            <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'center' }}>Total Needed</th>
                                            <th style={{ padding: '10px', border: '1px solid #f5c6cb', textAlign: 'center' }}>Total Missing</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedInsufficientArray.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ padding: '8px', border: '1px solid #f5c6cb', fontFamily: 'monospace' }}>{item.sku}</td>
                                                <td style={{ padding: '8px', border: '1px solid #f5c6cb' }}>{item.productName}</td>
                                                <td style={{ padding: '8px', border: '1px solid #f5c6cb' }}>
                                                    {item.orderIds.join(', ')}
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #f5c6cb', textAlign: 'center' }}>{item.totalQuantity}</td>
                                                <td style={{
                                                    padding: '8px',
                                                    border: '1px solid #f5c6cb',
                                                    textAlign: 'center',
                                                    color: '#dc3545',
                                                    fontWeight: 'bold',
                                                }}>
                                                    {item.totalMissing}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
