using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusNavigate.Domain.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddTravelSessionDestinationCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DestinationLatitude",
                table: "TravelSessions",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DestinationLongitude",
                table: "TravelSessions",
                type: "numeric(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestinationLatitude",
                table: "TravelSessions");

            migrationBuilder.DropColumn(
                name: "DestinationLongitude",
                table: "TravelSessions");
        }
    }
}
