"use client";

// "use client" is required here because this page uses:
// - useState (React hook for managing form data and UI state)
// - form submission with user interaction
// Server Components can't do any of that — they're static.
// As a rule of thumb: if the page reacts to what the user does, it's a Client Component.

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// TypeScript: we define the shape of our form data up front.
// This isn't strictly required but it catches typos early —
// if you mistype "emai" instead of "email" somewhere, TypeScript
// will tell you immediately instead of failing silently at runtime.
type FormData = {
  fullName: string;
  email: string;
  password: string;
};

// These are the only email domains we accept.
// Keeping them in an array means adding a new domain later is one line.
const ALLOWED_DOMAINS = ["student.ufv.ca", "ufv.ca"];

// This function takes an email string and returns true if it ends
// in one of our allowed domains, false otherwise.
// We do this check on the client (here, before hitting Supabase) for
// two reasons:
// 1. Faster feedback — the user finds out immediately, no network round trip
// 2. Friendlier error — we can say "use your UFV email" instead of
//    a generic Supabase auth error
//
// Note: this is not your only line of defense. In Supabase you should
// also add a database rule or edge function that enforces this server-side,
// so someone can't bypass the UI and call your API directly.
function isUFVEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  return ALLOWED_DOMAINS.some((domain) => lower.endsWith(`@${domain}`));
}

// Password rules — defined once here so the validation logic and the
// helper text shown to the user stay in sync automatically.
// If you change the minimum length, you only change it in one place.
const PASSWORD_MIN_LENGTH = 8;

function validateForm(data: FormData): string | null {
  // Returns an error message string if something is wrong,
  // or null if everything looks good.
  // We check in order of importance — name first, then email, then password.

  if (!data.fullName.trim()) {
    return "Please enter your full name.";
  }

  if (!data.email.trim()) {
    return "Please enter your email address.";
  }

  if (!isUFVEmail(data.email)) {
    return "Please use your UFV email address (student.ufv.ca or ufv.ca).";
  }

  if (!data.password) {
    return "Please enter a password.";
  }

  if (data.password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return null; // null means no error — all good
}

export default function RegisterPage() {
  // useState manages pieces of data that, when they change, should
  // cause the page to re-render and show updated UI.
  //
  // formData holds what the user has typed into each field.
  // We store all three fields in one object rather than three separate
  // useState calls — it keeps related data together.
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
  });

  // error holds a message to show the user if something goes wrong.
  // null means no error to show.
  const [error, setError] = useState<string | null>(null);

  // loading tracks whether we're waiting for Supabase to respond.
  // We use this to disable the button and show "Creating account..."
  // so the user knows something is happening.
  const [loading, setLoading] = useState(false);

  // submitted tracks whether signup succeeded, so we can swap the form
  // out for a "check your inbox" confirmation message.
  const [submitted, setSubmitted] = useState(false);

  // showPassword toggles the password field between type="password"
  // and type="text" — the show/hide button controls this.
  const [showPassword, setShowPassword] = useState(false);

  // This handler runs on every keystroke in any of the three input fields.
  // Instead of writing a separate handler for each field, we use the
  // field's "name" attribute to know which field changed.
  //
  // e is the change event from the input. e.target is the input element.
  // e.target.name is the name="..." attribute we put on the input.
  // e.target.value is what the user typed.
  //
  // The spread operator (...formData) copies all existing fields,
  // then [e.target.name]: e.target.value overwrites just the one that changed.
  // This way we don't accidentally wipe out the other fields.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // This runs when the form is submitted (user clicks the button or presses Enter).
  // It's async because calling Supabase involves waiting for a network response.
  async function handleSubmit(e: React.FormEvent) {
    // Prevent the default browser behaviour of reloading the page on submit.
    // In traditional HTML forms, submitting causes a page reload.
    // In React we handle submission ourselves, so we stop that.
    e.preventDefault();

    // Clear any previous error before trying again.
    setError(null);

    // Run our validation. If it returns a string, something is wrong —
    // show the error and stop here. Don't call Supabase with bad data.
    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return; // early return — stop the function here
    }

    // From here on we know the data is valid. Show the loading state.
    setLoading(true);

    try {
      // supabase.auth.signUp() creates a new user in Supabase Auth.
      // Because "Confirm email" is on in your Supabase settings,
      // this does NOT log the user in — it sends them a confirmation email.
      // The user won't be able to log in until they click that link.
      //
      // We also pass their full name in the "data" field — this stores it
      // in the user's metadata in Supabase, accessible later as
      // user.user_metadata.full_name
      const { error: supabaseError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      });

      if (supabaseError) {
        // Supabase returned an error. We show a human-readable message
        // rather than the raw Supabase error text, which can be confusing.
        //
        // "User already registered" is the message Supabase sends when
        // someone tries to sign up with an email that already exists.
        if (supabaseError.message.includes("already registered")) {
          setError(
            "An account with this email already exists. Try logging in instead."
          );
        } else {
          // For anything else unexpected, show the raw message as a fallback.
          // We'll improve this as we learn which errors actually come up.
          setError(supabaseError.message);
        }
        return;
      }

      // No error — signup worked. Show the confirmation screen.
      setSubmitted(true);
    } catch {
      // This catches network errors — e.g. the user is offline,
      // or Supabase is unreachable. Supabase errors come back as
      // normal return values (the error property above), not thrown
      // exceptions — but we catch anyway as a safety net.
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      // finally runs whether the try succeeded or failed.
      // Always turn off loading when we're done, no matter what happened.
      setLoading(false);
    }
  }

  // Check if the form is complete enough to enable the submit button.
  // We require all three fields to have something in them.
  // This is a lightweight check — the real validation runs on submit.
  const isFormFilled =
    formData.fullName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password !== "";

  // --- SUCCESS STATE ---
  // If signup succeeded, swap the entire form for a confirmation message.
  // We don't redirect automatically — we tell the user to check their email.
  if (submitted) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white text-xl">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">
            Check your inbox
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We sent a confirmation link to{" "}
            <span className="font-medium text-black">{formData.email}</span>.
            Click the link in the email to activate your account.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Can&apos;t find it? Check your spam folder.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 text-sm font-medium text-black hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // --- FORM STATE ---
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600">
        UFV students and staff only.
      </p>

      {/*
        onSubmit connects the form submission to our handleSubmit function.
        This fires when the user clicks the button OR presses Enter
        in any field — standard form behaviour.
      */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">

        {/* Full name field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Alex Smith"
            value={formData.fullName}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        {/* Email field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            UFV email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@student.ufv.ca"
            value={formData.email}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        {/* Password field with show/hide toggle */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-black"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Error message — only renders if there's an error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/*
          Submit button — disabled when the form isn't filled or we're loading.
        */}
        <button
          type="submit"
          disabled={!isFormFilled || loading}
          className={`mt-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity
            ${!isFormFilled || loading
              ? "bg-black opacity-40 cursor-not-allowed"
              : "bg-black hover:opacity-90"
            }`}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-black hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}