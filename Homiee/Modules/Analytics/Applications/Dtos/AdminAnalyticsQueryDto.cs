namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class AdminAnalyticsQueryDto
    {
        /// <summary>Number of days to look back for time-series data (default 30)</summary>
        public int Days { get; set; } = 30;

        /// <summary>How many items in each leaderboard (default 5)</summary>
        public int TopN { get; set; } = 5;
    }
}
