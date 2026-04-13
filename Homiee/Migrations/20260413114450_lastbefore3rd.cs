using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homiee.Migrations
{
    /// <inheritdoc />
    public partial class lastbefore3rd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Sellers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Sellers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
