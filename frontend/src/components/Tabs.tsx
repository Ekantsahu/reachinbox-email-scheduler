interface TabsProps {
  activeTab: "scheduled" | "sent";
  onChange: (tab: "scheduled" | "sent") => void;
}

export default function Tabs({
  activeTab,
  onChange,
}: TabsProps) {
  return (
    <div className="flex gap-6 border-b">
      <button
        type="button"
        onClick={() => onChange("scheduled")}
        className={`pb-3 text-sm font-medium ${
          activeTab === "scheduled"
            ? "border-b-2 border-black text-black"
            : "text-gray-500"
        }`}
      >
        Scheduled Emails
      </button>

      <button
        type="button"
        onClick={() => onChange("sent")}
        className={`pb-3 text-sm font-medium ${
          activeTab === "sent"
            ? "border-b-2 border-black text-black"
            : "text-gray-500"
        }`}
      >
        Sent Emails
      </button>
    </div>
  );
}