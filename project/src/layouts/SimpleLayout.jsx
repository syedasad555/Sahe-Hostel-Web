import { Outlet } from 'react-router-dom';

const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-24">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default SimpleLayout;
