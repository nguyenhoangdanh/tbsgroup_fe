import UserProfileForm from './form';

export const ProfileContainer = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-center md:text-left md:w-1/2">Thông tin cá nhân</h1>
      <div className="flex flex-col w-full max-w-lg mx-auto">
        <UserProfileForm />
      </div>
    </div>
  );
};
