namespace Homiee.Shared.Applications.Options
{
    public class RecommendationWeightsOptions
    {
        public const string SectionName = "RecommendationWeights";

        public double CategoryMatch { get; set; } = 40.0;
        public double PriceSimilarity { get; set; } = 25.0;
        public double SameSeller { get; set; } = 15.0;
        public double Rating { get; set; } = 10.0;
        public double ReviewCount { get; set; } = 10.0;
    }
}
