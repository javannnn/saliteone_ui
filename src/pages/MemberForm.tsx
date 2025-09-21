import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoc, updateDoc, createDoc } from "@/lib/api"; // updated imports
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Spinner from "@/components/ui/spinner";

type MembershipFee = {
  date: string;
  amount: string;
  currency: string;
  confirm: boolean;
};

type MemberFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  status: string;
  marital_status: string;
  member_link?: string;
  baptismal_name?: string;
  baptism_date?: string;
  volunteer: boolean;
  province?: string;
  country?: string;
  postal_code?: string;
  city?: string;
  father_of_repentance?: string;
  contributing_tithe: boolean;
  membership_fees: MembershipFee[];
};

export default function MemberForm() {
  const navigate = useNavigate();
  const { memberName } = useParams<{ memberName: string }>();
  const isEdit = Boolean(memberName);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<MemberFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    status: "",
    marital_status: "",
    volunteer: false,
    contributing_tithe: false,
    membership_fees: [],
  });

  useEffect(() => {
    if (isEdit && memberName) {
      (async () => {
        try {
          const data = await getDoc<MemberFormData>("Member", memberName);
          setMember({
            ...data,
            volunteer: Boolean(data.volunteer),
            contributing_tithe: Boolean(data.contributing_tithe),
            membership_fees: data.membership_fees || [],
          });
        } catch (err) {
          toast.error("Failed to load member data");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [isEdit, memberName]);

  const handleChange = (field: keyof MemberFormData, value: any) => {
    setMember({ ...member, [field]: value });
  };

  const handleFeeChange = (index: number, field: keyof MembershipFee, value: any) => {
    const updatedFees = [...member.membership_fees];
    updatedFees[index][field] = value;
    setMember({ ...member, membership_fees: updatedFees });
  };

  const addFeeRow = () => {
    setMember({
      ...member,
      membership_fees: [...member.membership_fees, { date: "", amount: "", currency: "", confirm: false }],
    });
  };

  const removeFeeRow = (index: number) => {
    const updatedFees = [...member.membership_fees];
    updatedFees.splice(index, 1);
    setMember({ ...member, membership_fees: updatedFees });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit && memberName) {
        await updateDoc("Member", memberName, member);
        toast.success("Member updated successfully");
      } else {
        await createDoc("Member", member); // <-- fixed here
        toast.success("Member created successfully");
      }
      navigate("/members");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/members")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-900"
        >
          Back to List
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Member" : "New Member"}</h1>
      </div>

      {/* Member Info Section */}
      <Card className="bg-blue-50 border-l-4 border-blue-400">
        <h2 className="text-lg font-semibold mb-4">Member Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="First Name"
            value={member.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Last Name"
            value={member.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Email"
            type="email"
            value={member.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Phone"
            value={member.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <select
            value={member.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select
            value={member.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="">Select Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={member.marital_status}
            onChange={(e) => handleChange("marital_status", e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="">Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
          </select>
          <input
            placeholder="Spouse Member"
            value={member.member_link || ""}
            onChange={(e) => handleChange("member_link", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Baptismal Name"
            value={member.baptismal_name || ""}
            onChange={(e) => handleChange("baptismal_name", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Baptism Date"
            type="date"
            value={member.baptism_date || ""}
            onChange={(e) => handleChange("baptism_date", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={member.volunteer}
              onChange={(e) => handleChange("volunteer", e.target.checked)}
              className="w-5 h-5"
            />
            <span>Volunteer</span>
          </label>
        </div>
      </Card>

      {/* Address & Father Section */}
      <Card className="bg-green-50 border-l-4 border-green-400">
        <h2 className="text-lg font-semibold mb-4">Address & Fathers Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Province"
            value={member.province || ""}
            onChange={(e) => handleChange("province", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Country"
            value={member.country || ""}
            onChange={(e) => handleChange("country", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Postal Code"
            value={member.postal_code || ""}
            onChange={(e) => handleChange("postal_code", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="City"
            value={member.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <input
            placeholder="Father of Repentance"
            value={member.father_of_repentance || ""}
            onChange={(e) => handleChange("father_of_repentance", e.target.value)}
            className="p-2 border rounded w-full"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={member.contributing_tithe}
              onChange={(e) => handleChange("contributing_tithe", e.target.checked)}
              className="w-5 h-5"
            />
            <span>Contributing Tithe</span>
          </label>
        </div>
      </Card>

      {/* Membership Fees Table */}
      <Card className="bg-yellow-50 border-l-4 border-yellow-400">
        <h2 className="text-lg font-semibold mb-4">Membership Fees</h2>
        <table className="w-full border border-gray-300">
          <thead className="bg-yellow-200">
            <tr>
              <th className="border px-2 py-1">No.</th>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">Currency</th>
              <th className="border px-2 py-1">Confirm</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {member.membership_fees.map((fee, idx) => (
              <tr key={idx} className="text-center">
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1">
                  <input
                    type="date"
                    value={fee.date}
                    onChange={(e) => handleFeeChange(idx, "date", e.target.value)}
                    className="p-1 border rounded w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={fee.amount}
                    onChange={(e) => handleFeeChange(idx, "amount", e.target.value)}
                    className="p-1 border rounded w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={fee.currency}
                    onChange={(e) => handleFeeChange(idx, "currency", e.target.value)}
                    className="p-1 border rounded w-full"
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="checkbox"
                    checked={fee.confirm}
                    onChange={(e) => handleFeeChange(idx, "confirm", e.target.checked)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => removeFeeRow(idx)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={addFeeRow}
        >
          Add Fee
        </button>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {saving ? "Saving..." : isEdit ? "Update Member" : "Create Member"}
        </button>
      </div>
    </div>
  );
}
