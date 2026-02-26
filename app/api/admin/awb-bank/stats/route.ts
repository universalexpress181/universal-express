import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase Admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic'; // Ensures this API is never cached so numbers are always live

export async function GET() {
  try {
    // Fetch only the columns we need for counting to keep the query fast
    const { data, error } = await supabase
        .from('awb_bank')
        .select('service_category, is_used');
    
    if (error) {
        console.error("Database error fetching AWB stats:", error);
        throw new Error("Failed to fetch statistics from database.");
    }

    // Initialize the stats object with default values (including COD)
    const stats = {
      prime: { total: 0, used: 0, available: 0 },
      express: { total: 0, used: 0, available: 0 },
      cargo: { total: 0, used: 0, available: 0 },
      cod: { total: 0, used: 0, available: 0 }
    };

    // If there is no data yet, just return the empty zeros
    if (!data || data.length === 0) {
        return NextResponse.json({ success: true, ...stats });
    }

    // Loop through the database rows and calculate the totals
    data.forEach((row) => {
      let currentCategory = null;

      // Match the database text to our stat objects
      if (row.service_category === 'Prime') {
          currentCategory = stats.prime;
      } else if (row.service_category === 'Air/Ground Express') {
          currentCategory = stats.express;
      } else if (row.service_category === 'Ground Cargo') {
          currentCategory = stats.cargo;
      } else if (row.service_category === 'COD') {
          currentCategory = stats.cod;
      }

      // If a match is found, increment the counters
      if (currentCategory) {
        currentCategory.total += 1; // Always increment total
        
        if (row.is_used === true) {
          currentCategory.used += 1;
        } else {
          currentCategory.available += 1;
        }
      }
    });

    // Send the calculated data back to the frontend
    return NextResponse.json({ 
        success: true, 
        ...stats 
    });

  } catch (error: any) {
    return NextResponse.json(
        { success: false, error: error.message || "An unexpected error occurred" }, 
        { status: 500 }
    );
  }
}