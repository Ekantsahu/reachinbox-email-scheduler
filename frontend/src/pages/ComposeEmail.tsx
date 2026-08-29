import { useRef, useState } from "react";
import { scheduleEmails } from "../services/api";
interface ComposeEmailProps {
  userId: string;
  senderEmail: string;
  onBack: () => void;
}

export default function ComposeEmail({
  userId,
  senderEmail,
  onBack,
}: ComposeEmailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("5");

  const [showSchedule, setShowSchedule] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");

      const emails = text
        .split(/[\n,;\s]+/)
        .map((item) => item.trim())
        .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));

      setRecipients((prev) => [
        ...prev,
        ...emails.filter((email) => !prev.includes(email)),
      ]);
    };

    reader.readAsText(file);

    event.target.value = "";
  };

  const handleRecipientInput = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter") return;

    const input = event.currentTarget;
    const email = input.value.trim();

    if (!email) return;

    if (!recipients.includes(email)) {
      setRecipients((prev) => [...prev, email]);
    }

    input.value = "";
  };

  const handleSchedule = async () => {
    if (!senderEmail.trim()) {
      alert("Sender email is required");
      return;
    }

    if (recipients.length === 0) {
      alert("Please add at least one recipient");
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

    if (!startTime) {
      alert("Please select a date and time");
      return;
    }

    try {
      setIsSubmitting(true);

      await scheduleEmails({
        userId,
        senderEmail,
        senderName: "",
        subject,
        body,
        recipients,
        startTime,
        delayMs: Number(delay) * 1000,
        hourlyLimit: Number(hourlyLimit),
      });

      alert("Emails scheduled successfully");

      onBack();
    } catch (error) {
      console.error("Failed to schedule emails:", error);

      alert(
        error instanceof Error ? error.message : "Failed to schedule emails",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative  min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-2xl text-gray-700 hover:text-black"
          >
            ←
          </button>

          <h1 className="text-xl font-medium text-gray-900">
            Compose New Email
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-900"
            title="Attachment"
          >
            📎
          </button>

          <button
            type="button"
            className="text-gray-500 hover:text-gray-900"
            title="Schedule"
          >
            🕒
          </button>

          <button
            type="button"
            onClick={() => setShowSchedule(true)}
            className="rounded-full border border-green-500 px-5 py-2 text-sm text-green-600 hover:bg-green-50"
          >
            Send Later
          </button>
          {startTime && (
            <p className="mt-2 text-right text-xs text-gray-500">
              Scheduled for {new Date(startTime).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {showSchedule && (
        <div className="absolute right-8 top-20 z-50 w-72 rounded-lg border bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-sm font-medium text-gray-900">Send Later</h2>

          <label className="mb-2 block text-xs text-gray-500">
            Pick date & time
          </label>

          <input
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-green-500"
          />

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setStartTime("");
                setShowSchedule(false);
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSchedule}
              disabled={isSubmitting}
              className="rounded-full border border-green-500 px-5 py-2 text-sm text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling..." : "Done"}
            </button>
          </div>
        </div>
      )}

      {/* Compose content */}
      <main className="mx-auto max-w-4xl px-8 py-8">
        {/* From */}
        <div className="flex items-center border-b py-3">
          <label className="w-20 text-sm text-gray-700">From</label>

          <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
            {senderEmail}
          </div>
        </div>

        {/* To */}
        <div className="flex items-start border-b py-3">
          <label className="w-20 pt-2 text-sm text-gray-700">To</label>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            {recipients.map((email) => (
              <span
                key={email}
                className="rounded-full border border-green-400 px-3 py-1 text-xs text-gray-700"
              >
                {email}
              </span>
            ))}

            <input
              type="email"
              placeholder="recipient@example.com"
              onKeyDown={handleRecipientInput}
              className="min-w-[220px] flex-1 border-none bg-transparent px-2 py-2 text-sm outline-none"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-green-600 hover:text-green-700"
            >
              ↑ Upload List
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Subject */}
        <div className="flex items-center border-b py-3">
          <label className="w-20 text-sm text-gray-700">Subject</label>

          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className="flex-1 border-none bg-transparent text-sm outline-none"
          />
        </div>

        {/* Delay + Hourly limit */}
        <div className="flex items-center gap-8 py-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">
              Delay between 2 emails
            </label>

            <input
              type="number"
              min="0"
              value={delay}
              onChange={(event) => setDelay(event.target.value)}
              className="w-16 rounded-md border px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Hourly Limit</label>

            <input
              type="number"
              min="1"
              value={hourlyLimit}
              onChange={(event) => setHourlyLimit(event.target.value)}
              className="w-16 rounded-md border px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Body */}
        <div className="mt-2 overflow-hidden rounded-lg bg-gray-50">
          <div className="border-b px-4 py-3 text-xs text-gray-400">
            Type Your Reply...
          </div>

          <div className="flex gap-4 border-b bg-white px-4 py-3 text-sm text-gray-500">
            <button type="button">↶</button>
            <button type="button">↷</button>
            <button type="button">T</button>
            <button type="button" className="font-bold">
              B
            </button>
            <button type="button" className="italic">
              I
            </button>
            <button type="button" className="underline">
              U
            </button>
            <span>|</span>
            <button type="button">☷</button>
            <button type="button">☰</button>
            <button type="button">❝</button>
          </div>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-[300px] w-full resize-none bg-gray-50 p-4 text-sm text-gray-800 outline-none"
          />
        </div>

        {/* Recipient count */}
        {recipients.length > 0 && (
          <p className="mt-3 text-sm text-gray-500">
            {recipients.length} email
            {recipients.length !== 1 ? "s" : ""} added
          </p>
        )}
      </main>
    </div>
  );
}
