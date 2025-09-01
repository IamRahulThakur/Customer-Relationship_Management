export default function Badge({ text, type }) {
  let colorClass = "bg-gray-300 text-gray-800";

  if (type === "success") colorClass = "bg-green-200 text-green-800";
  else if (type === "warning") colorClass = "bg-yellow-200 text-yellow-800";
  else if (type === "danger") colorClass = "bg-red-200 text-red-800";
  else if (type === "primary") colorClass = "bg-blue-200 text-blue-800";

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
      {text}
    </span>
  );
}
