namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class NewUsersByDayDto
    {
        public string Date { get; set; } = string.Empty;
        public int Customers { get; set; }
        public int Sellers { get; set; }
    }
}
