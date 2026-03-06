import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import PusherNotification from './Pushernotification';

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const accessToken = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('user');
  const userObj = userData ? JSON.parse(userData) : null;
  const userId = userObj?.id ?? null;


  return (
    <>
      <div className="min-h-screen xl:flex">
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
        >
          <AppHeader />
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
      <PusherNotification />
    </>
  );
}

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
