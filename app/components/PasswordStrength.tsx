"use client";

import { PASSWORD_RULES, firstUnmetRule } from "@/lib/password";

// password strength bar, used on register / reset / account settings so
// it's always checking the same rules the submit button enforces
export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const next = firstUnmetRule(password);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {PASSWORD_RULES.map((rule) => (
          <div
            key={rule.key}
            className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
              rule.test(password) ? "bg-[#A0C878]" : "bg-gray-100"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-gray-400">
        {next ? `Needs: ${next.label.toLowerCase()}` : "Strong password ✓"}
      </p>
    </div>
  );
}
