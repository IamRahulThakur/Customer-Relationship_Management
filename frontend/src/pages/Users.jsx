// File: src/pages/Users.jsx (Updated with Loading States)
import { useEffect, useState } from "react";
import api from "../api/axios";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import useAuthStore from "../store/authStore";
import Modal from "../components/Modal";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    emailId: "",
    password: "",
    role: "Agent",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    emailId: "",
    role: "Agent",
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { user } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data || []);
      setTotalPages(1);
      setTotalUsers(res.data.length || 0);
    } catch (err) {
      console.error(err);
      alert(
        "Failed to fetch users: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === "Admin") {
      fetchUsers();
    }
  }, [user.role]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const roleBadgeType = (role) => {
    const types = {
      Admin: "danger",
      Agent: "primary",
    };
    return types[role] || "default";
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const userData = {
        name: formData.name,
        emailId: formData.emailId,
        password: formData.password,
        role: formData.role,
      };

      await api.post("/auth/register", userData);

      setShowCreateModal(false);
      setFormData({ name: "", emailId: "", password: "", role: "Agent" });
      setSuccessMessage("User created successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const userData = {
        name: editFormData.name,
        emailId: editFormData.emailId,
        role: editFormData.role,
      };

      await api.patch(`/users/${selectedUser._id}`, userData);

      setShowEditModal(false);
      setSelectedUser(null);
      setSuccessMessage("User updated successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // File: src/pages/Users.jsx (Updated delete handler)
  const handleDeleteUser = async (userId) => {
    // Prevent deleting yourself
    if (userId === user._id) {
      alert("You cannot delete your own account");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setDeleting(userId);
    try {
      const response = await api.delete(`/users/${userId}`);

      // Check if the response has a success message
      if (response.data && response.data.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage("User deleted successfully!");
      }

      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage = error.response?.data?.error || error.message;
      alert("Failed to delete user: " + errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      emailId: user.emailId,
      role: user.role,
    });
    setShowEditModal(true);
    setError("");
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "emailId", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (val) => <Badge text={val} type={roleBadgeType(val)} />,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => new Date(val).toLocaleDateString(),
    },
  ];

  const renderRowActions = (userItem) => (
    <div className="flex space-x-2">
      <button
        onClick={() => openEditModal(userItem)}
        className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
        title="Edit User"
        disabled={deleting === userItem._id}
      >
        Edit
      </button>
      <button
        onClick={() => handleDeleteUser(userItem._id)}
        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
        title="Delete User"
        disabled={deleting === userItem._id}
      >
        {deleting === userItem._id ? "Deleting..." : "Delete"}
      </button>
    </div>
  );

  const handleModalOpen = () => {
    setFormData({ name: "", emailId: "", password: "", role: "Agent" });
    setError("");
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
    setError("");
  };

  // Only show users page to admins
  if (user.role !== "Admin") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600">
          Only administrators can access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management ({totalUsers})</h1>
        <button
          onClick={handleModalOpen}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading..." : "Add User"}
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading users...</div>
      ) : (
        <>
          <Table
            columns={columns}
            data={users}
            renderRowActions={renderRowActions}
          />

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </>
      )}

      {/* Create User Modal (Registration) */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title="Register New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
              minLength={2}
              maxLength={50}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              placeholder="Email Address"
              value={formData.emailId}
              onChange={(e) =>
                setFormData({ ...formData, emailId: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
              minLength={8}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
              title="Password must be at least 8 characters long, include uppercase, lowercase, number, and special character"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Must include uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
              disabled={submitting}
            >
              <option value="Agent">Agent</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Register User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleModalClose}
        title="Edit User"
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                placeholder="Full Name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
                required
                minLength={2}
                maxLength={50}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                placeholder="Email Address"
                value={editFormData.emailId}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, emailId: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                value={editFormData.role}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, role: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
                required
                disabled={submitting}
              >
                <option value="Agent">Agent</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Update User"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
