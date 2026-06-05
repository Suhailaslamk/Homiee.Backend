namespace Homiee.Modules.Identity.Domain.Entities
{
    public class RevokedAccessToken
    {
       
            public int Id { get; set; }          
            public string Token { get; set; }    
            public DateTime ExpiresAt { get; set; } 
    }
}
