namespace Homiee.Modules.Identity.Application.Dtos
{
    public class SellerStatusBreakdownDto
    {
        public int Pending { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
        public int Suspended { get; set; }
    }
}
