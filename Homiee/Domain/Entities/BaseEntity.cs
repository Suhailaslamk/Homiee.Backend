namespace Homiee.Domain.Entities
{
    public class BaseEntity
    {
        public int Id { get; set; }

        public DateTime CreatedOn { get; set; }= DateTime.Now;
        public string? CreatedBy { get; set; } = string.Empty;
        public DateTime ModifiedOn { get; set; } 
        public string? ModifiedBy { get; set; } = string.Empty;

        public bool IsDeleted { get; set; } = false;
        public string DeletedBy { get; set; } = string.Empty;
        public DateTime DeletedOn { get; set; } 

    }
}
