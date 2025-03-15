import React from 'react'
import Header from './Header';
import Footer from './Footer';
import CompanyImageSlider from './CompanyImageSlider';

interface IMainLayoutProps {
    title?: string;
    children: React.ReactNode;
}

const _MainLayout: React.FC<IMainLayoutProps> = ({ title, children }) => {
    return (
        <div className="default-theme w-full flex flex-col min-h-screen">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="flex-grow flex flex-col">
                {/* Slider Section */}
                <section className="w-full px-4 py-4">
                    <CompanyImageSlider />
                </section>

                {/* Content Section */}
                <section className="flex-grow w-full px-4 py-4">
                    <div className="w-full md:w-[85%] lg:w-[80%] xl:w-[70%] 2xl:w-[60%] mx-auto 
                        border border-gray-200 shadow-sm p-3 sm:p-4 md:p-6 
                        rounded-lg sm:rounded-xl bg-white dark:bg-gray-800">
                        {children}
                    </div>
                </section>
            </main>

            {/* Footer - ngoài main để đảm bảo nó ở cuối trang */}
            <Footer />
        </div>
        // <div className="default-theme w-full h-full flex flex-col min-h-screen">
        //     <Header />
        //     <div className="p-4">
        //     </div>
        //     <main className="flex-grow px-4 py-6 gap-4">
        //         <CompanyImageSlider />
        //         <div className="w-full md:w-[85%] lg:w-[80%] xl:w-[70%] 2xl:w-[60%] h-full mt-5 mx-auto border border-gray-200
        //         shadow-sm p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl">
        //             {children}
        //         </div>
        //         {/* <FooterWrapper> */}
        //         <Footer />
        //         {/* </FooterWrapper> */}
        //     </main>

        // </div>
    )
}

const MainLayout = React.memo(_MainLayout);
export default MainLayout;