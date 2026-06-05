using Homiee.Shared.Domain.Entities;

namespace Homiee.Modules.Catalog.Domain.Entities
{
    public class Category : BaseEntity
    {
        public string Name { get; private set; }

        public bool IsActive { get; private set; } = true;
        public Category(string name)
        {
            SetName(name);
        }

        public void SetName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Category name is required");

            Name = name.Trim();
        }
        public void Disable()
        {
            IsActive = false;
        }
        public void Enable()
        {
            IsActive = true;
        }

    }
}
