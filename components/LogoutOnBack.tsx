"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutOnBack() {
  const router = useRouter();

  useEffect(() => {
    // 1. Push a dummy state to history so the back button has something to "pop"
    // This effectively disables the immediate "back" action
    window.history.pushState(null, "", window.location.href);

    const handleBackButton = async (event: PopStateEvent) => {
      // 2. Prevent the default browser back action
      event.preventDefault();

      // 3. Show confirmation dialog
      const shouldLogout = window.confirm("Are you sure you want to leave? You will be logged out.");

      if (shouldLogout) {
        // 4. If YES: Log out and go to landing page
        await supabase.auth.signOut();
        router.replace("/"); // Use replace to clear history stack
      } else {
        // 5. If NO: Push the state back in so the "trap" remains active
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Listen for the "popstate" event (which happens when back is clicked)
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [router]);

  return null; // This component renders nothing visibly
}