import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AppLayout: React.FC = () => {
    return (
        <div className="app-shell">
            {/* простенькая навигация; можешь заменить на своё меню */}
            <nav className="app-nav" style={{ display: 'flex', gap: 12, padding: 12 }}>
                <Link to="/app">Home</Link>
                <Link to="/app/items">Items</Link>
                <Link to="/app/account">Account</Link>
                <Link to="/app/about">About</Link>
            </nav>

            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
