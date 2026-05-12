using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homiee.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestedDeliveryDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RequestedDeliveryDate",
                table: "Orders",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequestedDeliveryDate",
                table: "Orders");
        }
    }
}
