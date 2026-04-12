using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class GetAddressDto
    {
             public int Id { get; set; }
            public string FullName { get; set; } 
            
            public string Phone { get; set; } 
            public string Line1 { get; set; }
            public string City { get; set; }
            public required string State { get; set; }
            public string Pincode { get; set; }

        }
    }



