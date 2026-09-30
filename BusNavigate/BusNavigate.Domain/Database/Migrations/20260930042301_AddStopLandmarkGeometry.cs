using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusNavigate.Domain.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddStopLandmarkGeometry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Geometry",
                table: "StopLandmarks",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Geometry",
                table: "StopLandmarks");
        }
    }
}
