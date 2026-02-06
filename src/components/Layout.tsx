import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC = () => {
    const location = useLocation();

    // References page requests a minimal footer
    const isMinimalFooter = location.pathname === '/references';

    return (
        <div className="flex flex-col min-h-screen bg-cacao-50 text-gray-800 font-sans">
            <Header />
            <main className="flex-grow w-full">
                <Outlet />
            </main>
            <Footer isMinimal={isMinimalFooter} />
        </div>
    );
};

export default Layout;
