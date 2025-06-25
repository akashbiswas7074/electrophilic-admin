"use client";

import { useState, FormEvent } from "react";
// Assuming you have these UI components from Shadcn/UI or similar
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MessageState {
  type: "success" | "error" | "";
  content: string;
}

export default function SendCustomEmailPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>({ type: "", content: "" });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", content: "" });

    if (!to || !subject || !htmlBody) {
      setMessage({ type: "error", content: "All fields are required." });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/send-custom-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, subject, htmlBody }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: "success", content: result.message || "Email sent successfully!" });
        setTo("");
        setSubject("");
        setHtmlBody("");
      } else {
        setMessage({ type: "error", content: result.message || "Failed to send email." });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setMessage({ type: "error", content: "An unexpected error occurred." });
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Send Custom Email</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <Label htmlFor="toEmail" className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</Label>
          <Input
            id="toEmail"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="user@example.com"
            required
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</Label>
          <Input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your email subject"
            required
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor="htmlBody" className="block text-sm font-medium text-gray-700 mb-1">HTML Body</Label>
          <Textarea
            id="htmlBody"
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            placeholder="<p>Your <b>HTML</b> email content here.</p>"
            rows={10}
            required
            className="w-full"
          />
        </div>

        {message.content && (
          <div
            className={`
              p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
          >
            {message.content}
          </div>
        )}

        <div>
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </form>
    </div>
  );
}