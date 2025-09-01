// File: src/components/Sidebar.jsx (Updated)
import { NavLink } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Sidebar({ onClose }) {
  const { user } = useAuthStore();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/leads", label: "Leads", icon: "👥" },
    { path: "/customers", label: "Customers", icon: "🤝" },
    { path: "/tasks", label: "Tasks", icon: "✅" },
  ];

  // Add Users menu item only for Admins
  if (user.role === 'Admin') {
    menuItems.push({ path: "/users", label: "Users", icon: "👥" });
  }

  const handleClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">CRM System</h1>
        <p className="text-sm text-gray-400 mt-1">Role: {user.role}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={handleClick}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-300 hover:bg-gray-700"
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700 lg:hidden">
        <button
          onClick={onClose}
          className="w-full p-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Close Menu
        </button>
      </div>
    </div>
  );
}