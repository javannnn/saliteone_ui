import { useQuery } from "@tanstack/react-query";
import { listMembers } from "@/lib/api";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react"; // only added for filters, no extra packages

export default function Members() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["members"],
    queryFn: listMembers,
  });

  const [filters, setFilters] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    status: "",
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((m) =>
      m.first_name.toLowerCase().includes(filters.first_name.toLowerCase()) &&
      m.last_name.toLowerCase().includes(filters.last_name.toLowerCase()) &&
      m.phone.toLowerCase().includes(filters.phone.toLowerCase()) &&
      m.status.toLowerCase().includes(filters.status.toLowerCase())
    );
  }, [data, filters]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Members</h1>
        <button
          onClick={() => navigate("/members/create")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Member
        </button>
      </div>

      <Card>
        {isLoading && (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Loading…</span>
          </div>
        )}
        {isError && <div className="text-red-600">Failed to load.</div>}
        {data && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="Filter First Name"
                    value={filters.first_name}
                    onChange={(e) =>
                      setFilters({ ...filters, first_name: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="Filter Last Name"
                    value={filters.last_name}
                    onChange={(e) =>
                      setFilters({ ...filters, last_name: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="Filter Phone"
                    value={filters.phone}
                    onChange={(e) =>
                      setFilters({ ...filters, phone: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="Filter Status"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2">Actions</th>
              </tr>
              <tr className="border-b bg-gray-100">
                <th className="px-3 py-2 text-left">First Name</th>
                <th className="px-3 py-2 text-left">Last Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((m) => (
                <tr
                  key={m.name}
                  className="border-b hover:bg-blue-100 transition-colors duration-200"
                >
                  <td className="px-3 py-2">{m.first_name}</td>
                  <td className="px-3 py-2">{m.last_name}</td>
                  <td className="px-3 py-2">{m.phone}</td>
                  <td className="px-3 py-2 text-zinc-500">{m.status}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() =>
                        navigate(`/members/${encodeURIComponent(m.name)}`)
                      }
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
