import { useEffect, useState } from 'react';
import { getAppointments } from '../api/appointments';

export default function AppointmentsList() {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await getAppointments();
            setAppointments(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Ошибка при загрузке записей:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const handleRefresh = () => {
        loadAppointments();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>Загрузка записей...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ color: 'red', padding: '20px' }}>
                <div>Ошибка: {error}</div>
                <button 
                    onClick={handleRefresh}
                    style={{ 
                        marginTop: '10px', 
                        padding: '8px 16px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    if (!appointments.length) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>Записей не найдено</div>
                <button 
                    onClick={handleRefresh}
                    style={{ 
                        marginTop: '10px', 
                        padding: '8px 16px', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Обновить
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Список записей ({appointments.length})</h2>
                <button 
                    onClick={handleRefresh}
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Обновить
                </button>
            </div>
            
            <div style={{ display: 'grid', gap: '15px' }}>
                {appointments.map(a => (
                    <div key={a.appointmentId} style={{ 
                        border: '1px solid #dee2e6', 
                        padding: '20px', 
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#495057' }}>service_id:</strong> 
                            <span style={{ marginLeft: '8px', color: '#007bff' }}>{a.service_id}</span>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#495057' }}>Время:</strong> 
                            <span style={{ marginLeft: '8px', color: "black" }}>{a.appointment_date}</span>
                        </div>
                        <div>
                            <strong style={{ color: '#495057' }}>Статус:</strong> 
                            <span 
                                style={{ 
                                    marginLeft: '8px', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    backgroundColor: a.status ? '#d4edda' : '#f8d7da',
                                    color: a.status ? '#155724' : '#721c24'
                                }}
                            >
                                {a.status || 'не указан'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}