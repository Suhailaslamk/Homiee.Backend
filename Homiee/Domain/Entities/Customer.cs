namespace Homiee.Domain.Entities
{
    public class Customer : BaseEntity
    {
        public string Name { get; set; }

        // Future-ready
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
    }
}
