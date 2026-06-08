namespace Homiee.Modules.AiImage.Application.Validators
{
    /// <summary>
    /// Layer-1 server-side prompt validation.
    /// Catches NSFW, hate, violence, spam, and injection attempts BEFORE
    /// spending an API call on Gemini.
    /// This is a fast keyword + heuristic check, not ML-based.
    /// Gemini safety settings provide the deeper layer.
    /// </summary>
    public static class PromptValidator
    {
        // ── Blocklist categories ─────────────────────────────────────────────
        private static readonly HashSet<string> NsfwTerms = new(StringComparer.OrdinalIgnoreCase)
        {
            "nude","naked","porn","pornographic","explicit","nsfw","sexual","erotic",
            "xxx","hentai","adult content","lingerie","underwear","genital","penis",
            "vagina","breast","nipple","sex","orgasm","masturbat"
        };

        private static readonly HashSet<string> HateTerms = new(StringComparer.OrdinalIgnoreCase)
        {
            "nazi","holocaust","genocide","ethnic cleansing","white supremacy",
            "kkk","kill","murder","terrorist","terrorism","bomb","shooting",
            "rape","assault","torture","suicide","self-harm","cutting","overdose"
        };

        private static readonly HashSet<string> InjectionPatterns = new(StringComparer.OrdinalIgnoreCase)
        {
            "ignore previous instructions","ignore all instructions","disregard your",
            "you are now","jailbreak","dan mode","do anything now","act as",
            "system:","[system]","</system>","<|system|>","prompt:","override"
        };

        private static readonly HashSet<string> SpamIndicators = new(StringComparer.OrdinalIgnoreCase)
        {
            "aaaaaa","bbbbbb","xxxxxx","123456789","zzzzzz","random random random"
        };

        // ── Public API ───────────────────────────────────────────────────────
        public static PromptValidationResult Validate(string prompt, int minLength, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(prompt))
                return PromptValidationResult.Fail("Prompt cannot be empty.");

            var trimmed = prompt.Trim();

            if (trimmed.Length < minLength)
                return PromptValidationResult.Fail($"Prompt is too short. Minimum {minLength} characters required.");

            if (trimmed.Length > maxLength)
                return PromptValidationResult.Fail($"Prompt is too long. Maximum {maxLength} characters allowed.");

            // Detect repeated characters (spam)
            if (HasExcessiveRepetition(trimmed))
                return PromptValidationResult.Fail("Prompt contains excessive repetition. Please write a meaningful description.");

            // Check NSFW
            foreach (var term in NsfwTerms)
                if (ContainsTerm(trimmed, term))
                    return PromptValidationResult.Fail("Prompt contains inappropriate content and cannot be processed.");

            // Check hate / violence
            foreach (var term in HateTerms)
                if (ContainsTerm(trimmed, term))
                    return PromptValidationResult.Fail("Prompt contains prohibited content and cannot be processed.");

            // Check injection
            foreach (var pattern in InjectionPatterns)
                if (trimmed.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                    return PromptValidationResult.Fail("Prompt contains invalid instructions and cannot be processed.");

            // Check spam
            foreach (var indicator in SpamIndicators)
                if (ContainsTerm(trimmed, indicator))
                    return PromptValidationResult.Fail("Prompt appears to be spam. Please write a meaningful description.");

            // Require at least some alphabetic content (not purely symbols/numbers)
            var alphaCount = trimmed.Count(char.IsLetter);
            if (alphaCount < 3)
                return PromptValidationResult.Fail("Prompt must contain meaningful text.");

            return PromptValidationResult.Ok(trimmed);
        }

        // ── Helpers ──────────────────────────────────────────────────────────
        private static bool ContainsTerm(string text, string term)
            => text.Contains(term, StringComparison.OrdinalIgnoreCase);

        private static bool HasExcessiveRepetition(string text)
        {
            if (text.Length < 6) return false;

            // Count distinct chars — if ≤2 unique chars and length > 8, it's spam
            var distinct = new HashSet<char>(text.Where(c => !char.IsWhiteSpace(c)));
            if (distinct.Count <= 2 && text.Length > 8) return true;

            // Check for a single word repeated many times
            var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (words.Length > 4)
            {
                var wordCounts = words.GroupBy(w => w.ToLower()).ToDictionary(g => g.Key, g => g.Count());
                if (wordCounts.Any(kv => kv.Value > words.Length * 0.6))
                    return true;
            }

            return false;
        }
    }

    public class PromptValidationResult
    {
        public bool IsValid { get; private init; }
        public string? ErrorMessage { get; private init; }
        public string SanitizedPrompt { get; private init; } = string.Empty;

        public static PromptValidationResult Ok(string sanitizedPrompt) =>
            new() { IsValid = true, SanitizedPrompt = sanitizedPrompt };

        public static PromptValidationResult Fail(string error) =>
            new() { IsValid = false, ErrorMessage = error };
    }
}