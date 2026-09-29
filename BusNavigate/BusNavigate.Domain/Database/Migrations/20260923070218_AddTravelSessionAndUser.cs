using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BusNavigate.Domain.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddTravelSessionAndUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExternalDeviceId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TravelSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    State = table.Column<int>(type: "integer", nullable: false),
                    DirectionId = table.Column<int>(type: "integer", nullable: false),
                    BoardingStopId = table.Column<int>(type: "integer", nullable: false),
                    AlightingStopId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastActivityAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TravelSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TravelSessions_BusStops_AlightingStopId",
                        column: x => x.AlightingStopId,
                        principalTable: "BusStops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TravelSessions_BusStops_BoardingStopId",
                        column: x => x.BoardingStopId,
                        principalTable: "BusStops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TravelSessions_Directions_DirectionId",
                        column: x => x.DirectionId,
                        principalTable: "Directions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TravelSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TravelSessions_AlightingStopId",
                table: "TravelSessions",
                column: "AlightingStopId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelSessions_BoardingStopId",
                table: "TravelSessions",
                column: "BoardingStopId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelSessions_DirectionId",
                table: "TravelSessions",
                column: "DirectionId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelSessions_UserId",
                table: "TravelSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_ExternalDeviceId",
                table: "Users",
                column: "ExternalDeviceId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TravelSessions");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
