using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homiee.Migrations
{
    /// <inheritdoc />
    public partial class AddAiImageGeneration1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiGenerationRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NormalizedPrompt = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OriginalPrompt = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PromptHash = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    GeneratedImageUrlsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SelectedImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HangfireJobId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeletedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiGenerationRequests", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiGenerationRequests_UserId_PromptHash_Status_CreatedOn",
                table: "AiGenerationRequests",
                columns: new[] { "UserId", "PromptHash", "Status", "CreatedOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiGenerationRequests");
        }
    }
}
