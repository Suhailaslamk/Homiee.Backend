using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homiee.Migrations
{
    /// <inheritdoc />
    public partial class makingpaymentstring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
        UPDATE Orders SET PaymentMethod =
        CASE
            WHEN PaymentMethod = 'COD'    THEN '1'
            WHEN PaymentMethod = 'Online' THEN '2'
            ELSE '1'
        END
        WHERE ISNUMERIC(PaymentMethod) = 0;
    ");

            // Fix OrderStatusHistories.Status — was nvarchar, convert string values to numbers
            migrationBuilder.Sql(@"
        UPDATE OrderStatusHistories SET Status =
        CASE
            WHEN Status = 'Pending'    THEN '0'
            WHEN Status = 'Processing' THEN '1'
            WHEN Status = 'Placed'     THEN '2'
            WHEN Status = 'Shipped'    THEN '3'
            WHEN Status = 'Delivered'  THEN '4'
            WHEN Status = 'Cancelled'  THEN '5'
            ELSE '0'
        END
        WHERE ISNUMERIC(Status) = 0;
    ");

            // Now alter the columns to int
            migrationBuilder.AlterColumn<int>(
                name: "PaymentMethod",
                table: "Orders",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "OrderStatusHistories",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert columns back to string
            migrationBuilder.AlterColumn<string>(
                name: "PaymentMethod",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int));

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int));

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "OrderStatusHistories",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int));

            // Convert numbers back to strings
            migrationBuilder.Sql(@"
        UPDATE Orders SET PaymentMethod =
        CASE
            WHEN PaymentMethod = '1' THEN 'COD'
            WHEN PaymentMethod = '2' THEN 'Online'
            ELSE 'COD'
        END
    ");

            migrationBuilder.Sql(@"
        UPDATE Orders SET Status =
        CASE
            WHEN Status = '0' THEN 'Pending'
            WHEN Status = '1' THEN 'Processing'
            WHEN Status = '2' THEN 'Placed'
            WHEN Status = '3' THEN 'Shipped'
            WHEN Status = '4' THEN 'Delivered'
            WHEN Status = '5' THEN 'Cancelled'
            ELSE 'Pending'
        END
    ");

            migrationBuilder.Sql(@"
        UPDATE OrderStatusHistories SET Status =
        CASE
            WHEN Status = '0' THEN 'Pending'
            WHEN Status = '1' THEN 'Processing'
            WHEN Status = '2' THEN 'Placed'
            WHEN Status = '3' THEN 'Shipped'
            WHEN Status = '4' THEN 'Delivered'
            WHEN Status = '5' THEN 'Cancelled'
            ELSE 'Pending'
        END
    ");
        }
    }
}
