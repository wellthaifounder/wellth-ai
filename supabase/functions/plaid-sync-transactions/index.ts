import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptPlaidToken } from "../_shared/encryption.ts";
import Resend from "https://esm.sh/resend@2.0.0";

const allowedOrigins = [
  "https://wellth-ai.app",
  "https://www.wellth-ai.app",
  Deno.env.get("ALLOWED_ORIGIN"),
].filter(Boolean);

function getCorsHeaders(requestOrigin: string | null) {
  const origin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[1];
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Helper function to get Plaid URL based on environment
const getPlaidUrl = (): string => {
  const env = Deno.env.get("PLAID_ENV") || "sandbox";

  const urls: Record<string, string> = {
    sandbox: "https://sandbox.plaid.com",
    development: "https://development.plaid.com",
    production: "https://production.plaid.com",
  };

  return urls[env] || urls["sandbox"];
};

// Comprehensive medical expense keywords for auto-categorization
const MEDICAL_KEYWORDS = [
  // Pharmacies
  "cvs",
  "walgreens",
  "rite aid",
  "walmart pharmacy",
  "kroger pharmacy",
  "costco pharmacy",
  "target pharmacy",
  "publix pharmacy",
  "safeway pharmacy",
  // Healthcare providers
  "kaiser",
  "sutter",
  "dignity health",
  "adventist health",
  "scripps",
  "sharp",
  "hoag",
  "cedars-sinai",
  "ucla health",
  "stanford health",
  // Labs
  "quest diagnostics",
  "labcorp",
  "biomat",
  "grifols",
  // Vision
  "visionworks",
  "lenscrafters",
  "pearle vision",
  "eyeglass world",
  // Dental
  "aspen dental",
  "gentle dental",
  "bright now dental",
  // Medical supplies
  "medline",
  "fsa store",
  "hsa store",
  "direct medical",
  // Telehealth
  "teladoc",
  "doctor on demand",
  "amwell",
  "mdlive",
  // Mental health
  "talkspace",
  "betterhelp",
  "cerebral",
  "headspace care",
  // Common terms
  "pharmacy",
  "medical",
  "hospital",
  "clinic",
  "doctor",
  "dentist",
  "dental",
  "orthodont",
  "vision",
  "optometry",
  "physical therapy",
  "urgent care",
  "lab",
  "radiology",
  "imaging",
  "prescription",
  "rx",
  "health",
  "blue cross",
  "aetna",
  "cigna",
  "united health",
  "humana",
  "dr ",
  "dds",
  "dmd",
  "chiropractic",
  "pediatric",
  "dermatology",
  "cardiology",
  "orthopedic",
  "veterinary",
];

const MEDICAL_CATEGORIES = [
  "healthcare",
  "pharmacy",
  "medical",
  "dentist",
  "optometrist",
  "veterinary",
  "healthcare services",
  "pharmacies",
  "medical services",
];

function isMedicalTransaction(name: string, category: string[]): boolean {
  const searchText = name.toLowerCase();
  const categoryText = category.join(" ").toLowerCase();

  // Check vendor name
  const hasVendorMatch = MEDICAL_KEYWORDS.some((keyword) =>
    searchText.includes(keyword),
  );

  // Check category
  const hasCategoryMatch = MEDICAL_CATEGORIES.some((medCat) =>
    categoryText.includes(medCat),
  );

  return hasVendorMatch || hasCategoryMatch;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Track enough context to send a failure notification if the sync errors out
  const syncCtx: { userEmail?: string; institutionName?: string } = {};

  try {
    const requestId = crypto.randomUUID();
    const { connection_id, start_date, end_date } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const plaidClientId = Deno.env.get("PLAID_CLIENT_ID")!;
    const plaidSecretKey = Deno.env.get("PLAID_SECRET")!;
    const plaidBaseUrl = getPlaidUrl();

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized");
    }
    syncCtx.userEmail = user.email;

    console.log(`[${requestId}] Syncing transactions`);

    // Get Plaid connection
    const { data: connection, error: connectionError } = await supabase
      .from("plaid_connections")
      .select("encrypted_access_token, item_id, institution_name")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .single();

    if (connectionError || !connection) {
      console.error("Connection error:", connectionError);
      throw new Error("Connection not found");
    }
    syncCtx.institutionName = connection.institution_name;

    // Decrypt the access token
    console.log(`[${requestId}] Decrypting Plaid access token`);
    const access_token = await decryptPlaidToken(
      connection.encrypted_access_token,
    );

    // Fetch transactions from Plaid
    console.log(`[${requestId}] Fetching transactions from ${plaidBaseUrl}`);
    const transactionsResponse = await fetch(
      `${plaidBaseUrl}/transactions/get`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecretKey,
          access_token,
          start_date:
            start_date ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          end_date: end_date || new Date().toISOString().split("T")[0],
        }),
      },
    );

    const transactionsData = await transactionsResponse.json();

    if (!transactionsResponse.ok) {
      console.error("Plaid transactions error:", transactionsData);
      throw new Error(
        transactionsData.error_message || "Failed to fetch transactions",
      );
    }

    console.log(
      "Retrieved transactions:",
      transactionsData.transactions.length,
    );

    // Get user's vendor preferences for better categorization
    const { data: userPreferences } = await supabase
      .from("user_vendor_preferences")
      .select("vendor_pattern, is_medical")
      .eq("user_id", user.id);

    // Get user's invoices for matching (exclude fully paid)
    const { data: userInvoices } = await supabase
      .from("invoices")
      .select("id, vendor, amount, date, invoice_date, status")
      .eq("user_id", user.id)
      .eq("is_reimbursed", false)
      .in("status", ["unpaid", "partially_paid"]);

    // Get user's vendor aliases for smarter matching
    const { data: vendorAliases } = await supabase
      .from("vendor_aliases")
      .select("canonical_vendor, alias")
      .eq("user_id", user.id);

    // Process and store transactions
    const transactionsToInsert = transactionsData.transactions.map(
      (txn: any) => {
        const vendorName = txn.merchant_name || txn.name;

        // Check user's learned preferences first
        let isMedical = false;
        let needsReview = false;
        if (userPreferences) {
          const preference = userPreferences.find((p) =>
            vendorName.toLowerCase().includes(p.vendor_pattern.toLowerCase()),
          );
          if (preference) {
            isMedical = preference.is_medical;
            // Confirmed by user preference — no review needed
          }
        }

        // Fall back to keyword detection — flag for user review since it's not user-confirmed
        if (!isMedical) {
          const keywordMatch = isMedicalTransaction(
            txn.name,
            txn.category || [],
          );
          if (keywordMatch) {
            isMedical = true;
            needsReview = true; // Requires user confirmation to prevent false positives
          }
        }

        return {
          user_id: user.id,
          plaid_transaction_id: txn.transaction_id,
          transaction_date: txn.date,
          vendor: vendorName,
          description: txn.name,
          amount: Math.abs(txn.amount),
          category: isMedical ? "medical" : txn.category?.[0] || "Other",
          is_medical: isMedical,
          is_hsa_eligible: isMedical && !needsReview, // Only auto-eligible if confirmed via preference
          needs_review: needsReview,
          reconciliation_status: isMedical ? "linked" : "unlinked",
          source: "plaid",
        };
      },
    );

    // Insert transactions (ignore duplicates)
    if (transactionsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("transactions")
        .upsert(transactionsToInsert, {
          onConflict: "plaid_transaction_id",
          ignoreDuplicates: true,
        })
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to store transactions");
      }

      console.log("Successfully inserted transactions:", inserted?.length || 0);

      // ── Auto-linking pipeline ─────────────────────────────────────────
      const matchStartTime = Date.now();
      let autoLinkedCount = 0;
      let suggestedCount = 0;
      let exceptionCount = 0;

      const medicalTransactions = (inserted || []).filter(
        (t: any) =>
          t.is_medical && t.reconciliation_status !== "linked_to_invoice",
      );

      if (
        medicalTransactions.length > 0 &&
        userInvoices &&
        userInvoices.length > 0
      ) {
        const aliases = vendorAliases || [];

        for (const txn of medicalTransactions) {
          const txnVendor = (txn.vendor || txn.description || "")
            .toLowerCase()
            .trim();
          let bestMatch: { invoiceId: string; confidence: number } | null =
            null;

          for (const invoice of userInvoices) {
            let confidence = 0;
            const invVendor = invoice.vendor.toLowerCase().trim();

            // Vendor match (40% weight) — check direct match, aliases, then fuzzy
            let vendorScore = 0;
            if (txnVendor === invVendor) {
              vendorScore = 1.0;
            } else if (
              txnVendor.includes(invVendor) ||
              invVendor.includes(txnVendor)
            ) {
              vendorScore = 0.8;
            } else {
              // Check aliases
              const aliasMatch = aliases.some((a) => {
                const canonical = a.canonical_vendor.toLowerCase().trim();
                const aliasText = a.alias.toLowerCase().trim();
                return (
                  (invVendor.includes(canonical) ||
                    canonical.includes(invVendor)) &&
                  (txnVendor.includes(aliasText) ||
                    aliasText.includes(txnVendor))
                );
              });
              if (aliasMatch) vendorScore = 1.0;
            }
            confidence += vendorScore * 0.4;

            // Amount match (40% weight) — within 2% tolerance
            const amountDiff = Math.abs(txn.amount - Number(invoice.amount));
            const avgAmount = (txn.amount + Number(invoice.amount)) / 2;
            if (avgAmount > 0 && amountDiff <= avgAmount * 0.02) {
              confidence += 0.4;
            }

            // Date proximity (20% weight) — within 3 days for auto-link tier
            const invoiceDate = invoice.invoice_date || invoice.date;
            if (invoiceDate) {
              const txnDate = new Date(txn.transaction_date);
              const invDate = new Date(invoiceDate);
              const daysDiff = Math.abs(
                (txnDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24),
              );
              if (daysDiff <= 3) {
                confidence += 0.2;
              } else if (daysDiff <= 7) {
                confidence += 0.1;
              }
            }

            if (
              confidence > 0.5 &&
              (!bestMatch || confidence > bestMatch.confidence)
            ) {
              bestMatch = { invoiceId: invoice.id, confidence };
            }
          }

          if (!bestMatch) {
            exceptionCount++;
            continue;
          }

          // Tier 1: Auto-link (confidence >= 0.9)
          if (bestMatch.confidence >= 0.9) {
            const { error: paymentError } = await supabase
              .from("payment_transactions")
              .insert({
                invoice_id: bestMatch.invoiceId,
                transaction_id: txn.id,
                user_id: user.id,
                payment_date: txn.transaction_date,
                amount: txn.amount,
                payment_source: "out_of_pocket",
                auto_linked: true,
                auto_linked_at: new Date().toISOString(),
                match_confidence: bestMatch.confidence,
                notes: `Auto-linked from Plaid sync (${Math.round(bestMatch.confidence * 100)}% confidence)`,
              });

            if (!paymentError) {
              await supabase
                .from("transactions")
                .update({
                  invoice_id: bestMatch.invoiceId,
                  reconciliation_status: "linked_to_invoice",
                })
                .eq("id", txn.id);

              autoLinkedCount++;
              // Remove invoice from candidates so it doesn't get double-linked
              const invoiceIdx = userInvoices.findIndex(
                (i) => i.id === bestMatch!.invoiceId,
              );
              if (invoiceIdx !== -1) userInvoices.splice(invoiceIdx, 1);
            } else {
              console.error(
                `[${requestId}] Auto-link failed for txn ${txn.id}:`,
                paymentError.message,
              );
              exceptionCount++;
            }
          }
          // Tier 2: Suggested match (0.7–0.9) — store suggestion, don't auto-link
          else if (bestMatch.confidence >= 0.7) {
            await supabase.from("transaction_invoice_suggestions").upsert(
              {
                transaction_id: txn.id,
                invoice_id: bestMatch.invoiceId,
                confidence_score: Math.round(bestMatch.confidence * 100),
                match_reason: `Vendor + amount + date match (${Math.round(bestMatch.confidence * 100)}%)`,
              },
              { onConflict: "transaction_id,invoice_id" },
            );
            suggestedCount++;
          }
          // Tier 3: Exception — below threshold
          else {
            exceptionCount++;
          }
        }

        console.log(
          `[${requestId}] Auto-matching: ${autoLinkedCount} auto-linked, ${suggestedCount} suggested, ${exceptionCount} exceptions`,
        );
      }

      // Log matching run for observability
      await supabase.from("matching_run_log").insert({
        user_id: user.id,
        trigger_source: "plaid_sync",
        transactions_processed: medicalTransactions.length,
        auto_linked_count: autoLinkedCount,
        suggested_count: suggestedCount,
        exception_count: exceptionCount,
        duration_ms: Date.now() - matchStartTime,
      });

      // Update last sync time
      await supabase
        .from("plaid_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", connection_id);

      return new Response(
        JSON.stringify({
          success: true,
          total: transactionsData.transactions.length,
          inserted: inserted?.length || 0,
          medical_detected:
            inserted?.filter((t: any) => t.is_medical).length || 0,
          auto_linked: autoLinkedCount,
          suggested_matches: suggestedCount,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: 0,
        inserted: 0,
        medical_detected: 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(
      "[plaid-sync-transactions] Error:",
      error instanceof Error ? error.message : error,
    );

    // Send sync failure notification if we know who the user is
    if (syncCtx.userEmail) {
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const resend = new Resend.Resend(resendKey);
          const institution = syncCtx.institutionName || "your bank";
          await resend.emails.send({
            from: "Wellth <notifications@wellth-ai.app>",
            to: [syncCtx.userEmail],
            subject: `Action needed: ${institution} sync failed`,
            html: `
              <h2>Bank sync failed</h2>
              <p>We were unable to sync transactions from <strong>${institution}</strong>.</p>
              <p>This can happen when your bank connection needs to be refreshed. Please log in to Wellth and reconnect your bank account to restore automatic syncing.</p>
              <p>Best regards,<br>The Wellth Team</p>
            `,
          });
        }
      } catch (emailErr) {
        // Email failure should not affect the main error response
        console.error(
          "[plaid-sync-transactions] Failed to send failure notification:",
          emailErr instanceof Error ? emailErr.message : emailErr,
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "Failed to sync transactions. Please try again.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
