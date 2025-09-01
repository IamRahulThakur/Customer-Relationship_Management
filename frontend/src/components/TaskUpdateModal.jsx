import { useState, useEffect } from "react";
import api from "../api/axios"; // axios instance

const TaskUpdateModal = ({ task, onClose, onUpdate }) => {
  // Initialize state only when task is provided
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : ""); // remove time part
      setStatus(task.status || "");
      setPriority(task.priority || "");
    }
  }, [task]);

  if (!task) return null; // Prevent rendering if no task is passed

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/tasks/${task._id}`, {
        title,
        dueDate,
        status,
        priority,
      });
      onUpdate(res.data); // update parent with new task
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md mx-2">
        <h2 className="text-xl font-bold mb-4">Update Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>

          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select priority</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskUpdateModal;
