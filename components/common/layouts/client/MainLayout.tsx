import React from 'react'
import Header from './Header';
import Footer from './Footer';

interface IMainLayoutProps {
    title?: string;
    children: React.ReactNode;
}

const _MainLayout: React.FC<IMainLayoutProps> = ({ title, children }) => {
    return (
        <div className="default-theme w-full h-full flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow px-4 py-6">
                <div className="w-full md:w-[85%] lg:w-[80%] xl:w-[70%] 2xl:w-[60%] h-full mx-auto border border-gray-200
                shadow-sm p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    )
}

const MainLayout = React.memo(_MainLayout);
export default MainLayout;