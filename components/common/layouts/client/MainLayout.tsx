import React from 'react'
import Header from './Header';
import UserAvatar from './UserAvatar';

interface IAuthLayoutProps {
    title: string;
    children: React.ReactNode;
}

const _MainLayout: React.FC<IAuthLayoutProps> = ({ title, children }) => {
    return (
        <div className="w-full h-full flex flex-col py-2">
            <Header>
                <UserAvatar
                    name="Hoang Danh Nguyen"
                    email="hoangdanh54317@gmail.com"
                />
            </Header>
            {children}
        </div>
    )
}

const MainLayout = React.memo(_MainLayout);
export default MainLayout;
