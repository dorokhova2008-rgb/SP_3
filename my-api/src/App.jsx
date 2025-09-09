import { useState } from 'react';
import AppointmentsList from './components/AppointmentsList';

function App() {
    const [activeTab, setActiveTab] = useState('appointments');

    return (
        <div className="app">
            {/* Хедер */}
            <header className="app-header">
                <h1>Система управления записями</h1>
                <nav className="app-nav">
                    <button 
                        className={activeTab === 'appointments' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => setActiveTab('appointments')}
                    >
                        Записи
                    </button>
                    <button 
                        className={activeTab === 'calendar' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => setActiveTab('calendar')}
                    >
                        Календарь
                    </button>
                    <button 
                        className={activeTab === 'statistics' ? 'nav-btn active' : 'nav-btn'}
                        onClick={() => setActiveTab('statistics')}
                    >
                        Статистика
                    </button>
                </nav>
            </header>

            {/* Основной контент */}
            <main className="app-main">
                {activeTab === 'appointments' && (
                    <section className="app-section">
                        <h2>Список записей</h2>
                        <AppointmentsList />
                    </section>
                )}
                
                {activeTab === 'calendar' && (
                    <section className="app-section">
                        <h2>Календарь записей</h2>
                        <div className="placeholder">
                            <p>Функция календаря в разработке</p>
                        </div>
                    </section>
                )}
                
                {activeTab === 'statistics' && (
                    <section className="app-section">
                        <h2>Статистика</h2>
                        <div className="placeholder">
                            <p>Статистика будет доступна скоро</p>
                        </div>
                    </section>
                )}
            </main>

            {/* Футер */}
            <footer className="app-footer">
                <p>© Ты умница!</p>
            </footer>
        </div>
    );
}

export default App;