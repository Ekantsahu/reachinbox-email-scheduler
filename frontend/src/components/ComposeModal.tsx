import { useState } from "react";
import { scheduleEmails } from "../services/api";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [delayMs, setDelayMs] = useState("2000");
  const [hourlyLimit, setHourlyLimit] = useState("200");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  if (!isOpen) {
    return null;
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = String(event.target?.result || "");

      const emails =
        content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

      const uniqueEmails = Array.from(
        new Set(emails.map((email) => email.trim().toLowerCase())),
      );

      setRecipients(uniqueEmails);
    };

    reader.readAsText(file);
  };

  const handleSchedule = async () => {
    if (!senderEmail.trim()) {
      alert("Sender email is required");
      return;
    }

    if (!subject.trim()) {
      alert("Subject is required");
      return;
    }

    if (!body.trim()) {
      alert("Email body is required");
      return;
    }

    if (recipients.length === 0) {
      alert("Please upload a file containing email addresses");
      return;
    }

    if (!startTime) {
      alert("Start time is required");
      return;
    }

    try {
      setIsSubmitting(true);

      await scheduleEmails({
        userId: "cmtd747v20000ho7bvdsuv6vp",
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
        recipients,
        startTime: new Date(startTime).toISOString(),
        delayMs: Number(delayMs),
        hourlyLimit: Number(hourlyLimit),
      });

      alert("Emails scheduled successfully");

      onClose();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to schedule emails",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Compose New Email
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Schedule emails to your recipients
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4">
            {/* Sender email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sender Email
              </label>

              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            {/* Sender name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sender Name
              </label>

              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Body
              </label>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email..."
                rows={6}
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>

            {/* Recipients */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Recipients
              </label>

              <div className="rounded-md border border-dashed border-gray-300 p-5 text-center">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="text-sm"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Upload a CSV or TXT file containing email addresses
                </p>
                {recipients.length > 0 && (
                  <p className="mt-3 text-sm font-medium text-green-600">
                    {recipients.length} email
                    {recipients.length !== 1 ? "s" : ""} detected
                  </p>
                )}
              </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time
                </label>

                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Delay (ms)
                </label>

                <input
                  type="number"
                  min="0"
                  value={delayMs}
                  onChange={(e) => setDelayMs(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hourly Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSchedule}
            disabled={isSubmitting}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
