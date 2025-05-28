import React from 'react';

interface IAuthLayoutProps {
  title: string;
  isLogin?: boolean;
  children: React.ReactNode;
  imageChildren?: React.ReactNode;
}

const _AuthLayout: React.FC<IAuthLayoutProps> = ({ title, imageChildren, children }) => {
  return (
    <div className="w-full h-screen flex items-center justify-center px-4">
      <div
        className="w-full h-full flex items-center justify-center border-2 border-gray-200 rounded-lg max-h-[550px]
            max-w-[450px] shadow-lg overflow-hidden sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] 2xl:max-w-[900px]
            3xl:max-w-[1000px] 4xl:max-w-[1100px] 5xl:max-w-[1200px] 6xl:max-w-[1300px] 7xl:max-w-[1400px] 8xl:max-w-[1500px] 9xl:max-w-[1600px] 10xl:max-w-[1700px] 11xl:max-w-[1800px] 12xl:max-w-[1900px] 13xl:max-w-[2000px] 14xl:max-w-[2100px] 15xl:max-w-[2200px] 16xl:max-w-[2300px] 17xl:max-w-[2400px] 18xl:max-w-[2500px] 19xl:max-w-[2600px] 20xl:max-w-[2700px] 21xl:max-w-[2800px] 22xl:max-w-[2900px] 23xl:max-w-[3000px] 24xl:max-w-[3100px] 25xl:max-w-[3200px] 26xl:max-w-[3300px] 27xl:max-w-[3400px] 28xl:max-w-[3500px] 29xl:max-w-[3600px] 30xl:max-w-[3700px] 31xl:max-w-[3800px] 32xl:max-w-[3900px] 33xl:max-w-[4000px] 34xl:max-w-[4100px] 35xl:max-w-[4200px] 36xl:max-w-[4300px] 37xl:max-w-[4400px] 38xl:max-w-[4500px] 39xl:max-w-[4600px] 40xl:max-w-[4700px] 41xl:max-w-[4800px] 42xl:max-w-[4900px] 43xl:max-w-[5000px] 44xl:max-w-[5100px] 45xl:max-w-[5200px] 46xl:max-w-[5300px] 47xl:max-w-[5400px] 48xl:max-w-[5500px] 49xl:max-w-[5600px] 50xl:max-w-[5700px] 51xl:max-w-[5800px] 52xl:max-w-[5900
            "
      >
        <div className="w-full h-full flex flex-col items-center justify-between">
          {imageChildren && (
            <div className="w-full h-full max-h-[150px] flex items-center justify-center">
              {imageChildren}
            </div>
          )}
          <div className="w-full h-full flex flex-col items-center py-6">
            <div className="w-full max-w-[450px] mx-auto h-auto ">
              {/* <h1 className="text-2xl font-bold text-center mb-5">
                                {isLogin ? 'Welcome back!' : 'Create an account'}
                            </h1> */}
              <h1 className="text-3xl font-bold text-center mb-5">{title}</h1>
            </div>
            <div className="w-full max-w-[450px] mx-auto h-auto">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthLayout = React.memo(_AuthLayout);
export default AuthLayout;
