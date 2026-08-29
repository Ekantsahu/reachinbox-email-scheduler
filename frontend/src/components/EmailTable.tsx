import type { Email } from "../types/email";

interface EmailTableProps {
  emails: Email[];
  type: "scheduled" | "sent";
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function EmailTable({ emails, type }: EmailTableProps) {
  if (emails.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <h3 className="text-base font-medium text-gray-900">
            No {type} emails
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {type === "scheduled"
              ? "Your scheduled emails will appear here."
              : "Your sent emails will appear here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-sm text-gray-500">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Subject</th>

            <th className="px-4 py-3 font-medium">
              {type === "scheduled" ? "Scheduled time" : "Sent time"}
            </th>

            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>

        <tbody>
          {emails.map((email) => (
            <tr key={email.id} className="border-b last:border-b-0">
              <td className="px-4 py-4 text-sm text-gray-900">
                {email.recipient}
              </td>

              <td className="px-4 py-4 text-sm text-gray-700">
                {email.subject}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {type === "scheduled"
                  ? formatDateTime(email.scheduledAt)
                  : formatDateTime(email.sentAt)}
              </td>

              <td className="px-4 py-4">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {email.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
