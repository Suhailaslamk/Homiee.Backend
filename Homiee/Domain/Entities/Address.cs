using System.Text.RegularExpressions;

namespace Homiee.Domain.Entities
{
    public class Address : BaseEntity
    {
        public int Id { get; private set; }
        public int UserId { get; private set; }

        public string FullName { get; private set; }
        public string Phone { get; private set; }
        public string Line1 { get; private set; }
        public string City { get; private set; }
        public string State { get; private set; }
        public string Pincode { get; private set; }

        public bool IsDefault { get; private set; }

        public Address(int userId, string fullName, string phone, string line1,
            string city, string state, string pincode)
        {
            UserId = userId;
            FullName = fullName;
            Phone = phone;
            Line1 = line1;
            City = city;
            State = state;
            Pincode = pincode;
        }
        public void Update(string fullName, string phone, string line1, string city, string state, string pincode)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new Exception("Full name is required");

            if (!Regex.IsMatch(phone, @"^[6-9]\d{9}$"))
                throw new Exception("Invalid phone number");

            if (string.IsNullOrWhiteSpace(line1))
                throw new Exception("Address line is required");

            if (string.IsNullOrWhiteSpace(city))
                throw new Exception("City is required");

            if (string.IsNullOrWhiteSpace(state))
                throw new Exception("State is required");

            if (!Regex.IsMatch(pincode, @"^\d{6}$"))
                throw new Exception("Invalid pincode");

            FullName = fullName.Trim();
            Phone = phone;
            Line1 = line1.Trim();
            City = city.Trim();
            State = state.Trim();
            Pincode = pincode;
        }
        public void SetDefault() => IsDefault = true;
    }
}
