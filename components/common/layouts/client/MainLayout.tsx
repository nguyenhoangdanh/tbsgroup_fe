import React from 'react'
import Header from './Header';
import UserAvatar from './UserAvatar';
import Footer from './Footer';

interface IAuthLayoutProps {
    title?: string;
    children: React.ReactNode;
}

const _MainLayout: React.FC<IAuthLayoutProps> = ({ title, children }) => {
    return (
        <div className="w-full h-full flex flex-col pt-2 min-h-screen gap-4 ">
            <Header>
                <UserAvatar
                    name="Hoang Danh Nguyen"
                    email="hoangdanh54317@gmail.com"
                />
            </Header>
            <div className="w-[60%] h-full flex-grow items-center justify-between mx-auto border border-gray-200
            shadow-sm p-4 rounded-xl">
                {children}
            </div>
            <Footer />
        </div>
    )
}

const MainLayout = React.memo(_MainLayout);
export default MainLayout;
