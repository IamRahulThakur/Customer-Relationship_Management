import { useEffect, useState } from "react";
import api from "../api/axios";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import useAuthStore from "../store/authStore";
import Modal from "../components/Modal";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    due: "",
    owner: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [leadsAndCustomers, setLeadsAndCustomers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    status: "Open",
    priority: "Medium",
    relatedTo: "",
    owner: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    dueDate: "",
    status: "Open",
    priority: "Medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 10,
        ...filters,
      }).toString();

      const res = await api.get(`/tasks?${queryParams}`);
      setTasks(res.data.tasks || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalTasks(res.data.pagination?.totalTasks || 0);
    } catch (err) {
      console.error(err);
      alert(
        "Failed to fetch tasks: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchLeadsAndCustomers = async () => {
    try {
      const [leadsRes, customersRes] = await Promise.all([
        api.get("/lead?limit=1000"),
        api.get("/customers?limit=1000"),
      ]);

      const leads = leadsRes.data.leads || [];
      const customers = customersRes.data.customers || [];

      const combined = [
        ...leads.map((lead) => ({
          _id: lead.emailId,
          name: lead.name,
          email: lead.emailId,
          type: "Lead",
        })),
        ...customers.map((customer) => ({
          _id: customer.emailId,
          name: customer.name,
          email: customer.emailId,
          type: "Customer",
        })),
      ];

      setLeadsAndCustomers(combined);
    } catch (err) {
      console.error("Failed to fetch leads and customers:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === "Admin") {
      fetchUsers();
    }
    fetchLeadsAndCustomers();
  }, [page, filters, user.role]);

  const statusBadgeType = (status) => {
    const types = {
      Open: "primary",
      "In Progress": "warning",
      Done: "success",
    };
    return types[status] || "default";
  };

  const priorityBadgeType = (priority) => {
    const types = {
      Low: "primary",
      Medium: "warning",
      High: "danger",
    };
    return types[priority] || "default";
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Find the selected lead/customer by email to get their ObjectId
      const selectedEntity = leadsAndCustomers.find(
        (item) => item.email === formData.relatedTo
      );

      if (!selectedEntity) {
        setError("Please select a valid lead or customer");
        return;
      }

      // Prepare task data - send email addresses, not ObjectIds
      const taskData = {
        title: formData.title,
        dueDate: formData.dueDate,
        status: formData.status,
        priority: formData.priority,
        relatedTo: selectedEntity.email, // Send email, not ObjectId
      };

      // Only send owner email for Admin users
      if (user.role === "Admin") {
        if (!formData.owner) {
          setError("Please select an owner for the task");
          return;
        }
        taskData.owner = formData.owner; // This should be email
      }
      // For Agent: no need to send owner, backend will use req.user._id

      console.log("Sending task data:", taskData);

      const response = await api.post("/tasks", taskData);
      console.log("Task created successfully:", response.data);

      setShowCreateModal(false);
      setFormData({
        title: "",
        dueDate: "",
        status: "Open",
        priority: "Medium",
        relatedTo: "",
        owner: "",
      });
      fetchTasks();
      alert("Task created successfully!");
    } catch (error) {
      console.error("Failed to create task:", error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const taskData = {
        title: editFormData.title,
        dueDate: editFormData.dueDate,
        status: editFormData.status,
        priority: editFormData.priority,
      };

      const response = await api.patch(`/tasks/${selectedTask._id}`, taskData);

      setShowEditModal(false);
      setSelectedTask(null);
      fetchTasks();
      alert("Task updated successfully!");
    } catch (error) {
      console.error("Failed to update task:", error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(errorMessage);
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    
    // Format the date for datetime-local input
    let formattedDueDate = "";
    if (task.dueDate) {
      const date = new Date(task.dueDate);
      // Convert to local datetime string in the format YYYY-MM-DDTHH:MM
      formattedDueDate = date.toISOString().slice(0, 16);
    }
    
    setEditFormData({
      title: task.title,
      dueDate: formattedDueDate,
      status: task.status,
      priority: task.priority,
    });
    setShowEditModal(true);
    setError("");
  };

  const columns = [
    { key: "title", label: "Title" },
    {
      key: "dueDate",
      label: "Due Date",
      render: (val, row) => (
        <span
          className={
            isOverdue(val) && row.status !== "Done"
              ? "text-red-600 font-bold"
              : ""
          }
        >
          {val ? new Date(val).toLocaleDateString() : "Not set"}
          {isOverdue(val) && row.status !== "Done" && " (Overdue)"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <Badge text={val} type={statusBadgeType(val)} />,
    },
    {
      key: "priority",
      label: "Priority",
      render: (val) => <Badge text={val} type={priorityBadgeType(val)} />,
    },
    {
      key: "owner",
      label: "Owner",
      render: (val, row) => {
        const isCurrentUser = val?._id === user._id || val?.emailId === user.emailId;
        return (
          <span className={isCurrentUser ? "font-semibold text-blue-600" : ""}>
            {val?.name || val?.emailId || "Unassigned"}
            {isCurrentUser && " (You)"}
          </span>
        );
      },
    },
    {
      key: "relatedTo",
      label: "Related To",
      render: (val, row) => {
        if (row.relatedModel === "Lead") {
          return `Lead: ${val?.name || val?.emailId || "Unknown"}`;
        } else if (row.relatedModel === "Customer") {
          return `Customer: ${val?.name || val?.emailId || "Unknown"}`;
        }
        return "Not specified";
      },
    },
  ];

  const renderRowActions = (task) => (
    <div className="flex space-x-2">
      <button
        onClick={() => openEditModal(task)}
        className="text-blue-600 hover:text-blue-800 text-sm"
        title="Edit Task"
      >
        Edit
      </button>
    </div>
  );

  const handleModalOpen = () => {
    setFormData({
      title: "",
      dueDate: "",
      status: "Open",
      priority: "Medium",
      relatedTo: "",
      owner: user.role === "Admin" ? "" : undefined,
    });
    setError("");
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTask(null);
    setError("");
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tasks ({totalTasks})</h1>
        <button
          onClick={handleModalOpen}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={filters.due}
          onChange={(e) => setFilters({ ...filters, due: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Tasks</option>
          <option value="overdue">Overdue</option>
        </select>

        {user.role === "Admin" && (
          <select
            value={filters.owner}
            onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">All Owners</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => {
            setFilters({ status: "", due: "", owner: "" });
            setPage(1);
          }}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading tasks...</div>
      ) : (
        <>
          <Table
            columns={columns}
            data={tasks}
            renderRowActions={renderRowActions}
          />

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          )}
        </>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title="Create New Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date *
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Related To (Email) *
            </label>
            <select
              value={formData.relatedTo}
              onChange={(e) =>
                setFormData({ ...formData, relatedTo: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
            >
              <option value="">Select Lead or Customer</option>
              {leadsAndCustomers.map((item) => (
                <option key={item._id} value={item.email}>
                  {item.name} ({item.email}) - {item.type}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select by email address
            </p>
          </div>

          {user.role === "Admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Assign to (Email) *
              </label>
              <select
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
                required
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user.emailId}>
                    {user.name} ({user.emailId})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select by email address
              </p>
            </div>
          )}

          {user.role === "Agent" && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-700">Task Assignment</p>
              <p className="text-sm text-blue-600">
                This task will be automatically assigned to you ({user.name || user.emailId})
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleModalClose}
        title="Edit Task"
      >
        {selectedTask && (
          <form onSubmit={handleUpdateTask} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                placeholder="Task title"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Due Date *
              </label>
              <input
                type="datetime-local"
                value={editFormData.dueDate}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, dueDate: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                value={editFormData.priority}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, priority: e.target.value })
                }
                className="w-full border p-2 rounded mt-1"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">Related To</p>
              <p className="text-sm text-gray-600">
                {selectedTask.relatedModel === "Lead" ? "Lead: " : "Customer: "}
                {selectedTask.relatedTo?.name ||
                  selectedTask.relatedTo?.emailId ||
                  "Unknown"}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">Assigned To</p>
              <p className="text-sm text-gray-600">
                {selectedTask.owner?.name ||
                  selectedTask.owner?.emailId ||
                  "Unassigned"}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Update Task
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
