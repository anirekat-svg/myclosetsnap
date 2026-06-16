import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AnalyzeInput = z.object({
  imageBase64: z.string().min(10),
  mimeType: z.string().default("image/jpeg"),
});

const AnalysisSchema = z.object({
  category: z.enum(["top", "bottom", "dress", "shoes", "outerwear", "accessory"]),
  name: z.string().min(1).max(60),
  color: z.string().min(1).max(40),
  description: z.string().min(1).max(200),
  seasons: z.array(z.enum(["spring", "summer", "fall", "winter"])).default([]),
});

/**
 * Vision call: classify a single clothing photo.
 * Uses Lovable AI Gateway (Gemini) — no user-provided key needed.
 */
export const analyzeClothing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a wardrobe stylist's assistant. Look at the clothing item in the image and return STRICT JSON with these fields: category (one of: top, bottom, dress, shoes, outerwear, accessory), name (2-4 words, e.g. 'Cream silk blouse'), color (dominant color, plain English), description (one short sentence), seasons (array, any of: spring, summer, fall, winter). Return ONLY the JSON object, no markdown.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Classify this clothing item." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[analyzeClothing] gateway error", res.status, text);
      if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted on this workspace.");
      throw new Error("Could not analyze the image.");
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response.");

    let parsed: unknown;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
    return AnalysisSchema.parse(parsed);
  });

// --- Outfit generation ---

const Occasion = z.enum(["work", "casual", "date", "dinner", "travel", "daily"]);

const GenerateInput = z.object({
  occasion: Occasion,
  weather: z.string().optional(),
});

const ItemRef = z.object({
  id: z.string().uuid(),
  category: z.enum(["top", "bottom", "dress", "shoes", "outerwear", "accessory"]),
  name: z.string().nullable(),
  color: z.string().nullable(),
  description: z.string().nullable(),
});

const OutfitPlan = z.object({
  title: z.string().min(1).max(60),
  notes: z.string().min(1).max(280),
  top_id: z.string().uuid().nullable(),
  bottom_id: z.string().uuid().nullable(),
  dress_id: z.string().uuid().nullable(),
  shoes_id: z.string().uuid().nullable(),
  outerwear_id: z.string().uuid().nullable(),
});

export const generateOutfit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // Load this user's wardrobe (RLS applies).
    const { data: items, error } = await context.supabase
      .from("clothing_items")
      .select("id, category, name, color, description")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    if (!items || items.length < 2) {
      throw new Error("Add at least a couple of items to your closet first.");
    }

    const refs = z.array(ItemRef).parse(items);

    const wardrobeJson = JSON.stringify(refs);

    const prompt = `You are a personal stylist. Pick ONE complete outfit from the user's wardrobe for the occasion: "${data.occasion}".${data.weather ? ` Weather: ${data.weather}.` : ""}

Rules:
- Use ONLY item IDs from the wardrobe list below.
- An outfit is either (top + bottom + shoes) OR (dress + shoes). Outerwear is optional.
- Make sure colors and formality match the occasion.
- Return STRICT JSON with these fields: title (short evocative name like "Quiet Tuesday"), notes (one sentence on why this works), top_id, bottom_id, dress_id, shoes_id, outerwear_id. Any unused slot must be null.
- IDs must exactly match values from the wardrobe.

Wardrobe:
${wardrobeJson}

Return ONLY JSON.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[generateOutfit] gateway error", res.status, text);
      if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted on this workspace.");
      throw new Error("Could not generate an outfit.");
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    let parsed: unknown;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
    const plan = OutfitPlan.parse(parsed);

    // Validate that every referenced ID belongs to the user.
    const idSet = new Set(refs.map((r) => r.id));
    const used = [plan.top_id, plan.bottom_id, plan.dress_id, plan.shoes_id, plan.outerwear_id].filter(Boolean) as string[];
    for (const id of used) {
      if (!idSet.has(id)) throw new Error("AI picked an item that isn't in your closet.");
    }

    // Persist as a saved=false outfit so the home page can read it back.
    const { data: inserted, error: insErr } = await context.supabase
      .from("outfits")
      .insert({
        occasion: data.occasion,
        title: plan.title,
        notes: plan.notes,
        top_id: plan.top_id,
        bottom_id: plan.bottom_id,
        dress_id: plan.dress_id,
        shoes_id: plan.shoes_id,
        outerwear_id: plan.outerwear_id,
        saved: false,
      })
      .select("id")
      .single();

    if (insErr) throw new Error(insErr.message);
    return { id: inserted.id as string, ...plan };
  });
