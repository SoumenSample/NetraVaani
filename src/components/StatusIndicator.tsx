import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface StatusIndicatorProps {
  status: "idle" | "sending" | "success" | "error";
  message?: string;
}

const StatusIndicator = ({ status, message }: StatusIndicatorProps) => {
  if (status === "idle") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className={`
        flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl border-2
        ${status === "sending" && "bg-blue-500/90 border-blue-300 text-white"}
        ${status === "success" && "bg-green-500/90 border-green-300 text-white"}
        ${status === "error" && "bg-red-500/90 border-red-300 text-white"}
      `}>
        {status === "sending" && (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-base font-bold">Sending...</span>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-base font-bold">{message} sent ✓</span>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-6 w-6" />
            <span className="text-base font-bold">Failed to send ✗</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;
