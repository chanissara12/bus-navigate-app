using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BusNavigate.Domain.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddRouteShapeTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RouteShapeImportStates",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    FeedVersion = table.Column<string>(type: "text", nullable: false),
                    ImportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RouteShapeImportStates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RouteShapePoints",
                columns: table => new
                {
                    DirectionId = table.Column<int>(type: "integer", nullable: false),
                    Sequence = table.Column<int>(type: "integer", nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    Longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RouteShapePoints", x => new { x.DirectionId, x.Sequence });
                    table.ForeignKey(
                        name: "FK_RouteShapePoints_Directions_DirectionId",
                        column: x => x.DirectionId,
                        principalTable: "Directions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RouteShapeImportStates");

            migrationBuilder.DropTable(
                name: "RouteShapePoints");
        }
    }
}
