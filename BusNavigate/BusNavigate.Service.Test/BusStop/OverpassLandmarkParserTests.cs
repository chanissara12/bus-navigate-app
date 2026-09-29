using BusNavigate.Domain.Entities;
using BusNavigate.Service.Implements.BusStop;

namespace BusNavigate.Service.Test.BusStop;

public class OverpassLandmarkParserTests
{
    [Fact]
    public void Parse_NodeWithCrossingTag_MapsToCrossingLandmarkType()
    {
        // Arrange
        const string json = """
            {"elements":[{"type":"node","id":123,"lat":13.75,"lon":100.50,"tags":{"highway":"crossing","name":"Test Crossing"}}]}
            """;

        // Act
        var result = OverpassLandmarkParser.Parse(json);

        // Assert
        var landmark = Assert.Single(result);
        Assert.Equal("node/123", landmark.ExternalOsmId);
        Assert.Equal(LandmarkType.Crossing, landmark.LandmarkType);
        Assert.Equal(13.75m, landmark.Latitude);
        Assert.Equal(100.50m, landmark.Longitude);
        Assert.Equal("Test Crossing", landmark.NameEn);
    }

    [Fact]
    public void Parse_NodeWithRailwayStationTag_MapsToTransitStationPointer()
    {
        // Arrange
        const string json = """
            {"elements":[{"type":"node","id":456,"lat":13.74,"lon":100.53,"tags":{"railway":"station","name":"BTS Siam"}}]}
            """;

        // Act
        var result = OverpassLandmarkParser.Parse(json);

        // Assert
        var landmark = Assert.Single(result);
        Assert.Equal(LandmarkType.TransitStationPointer, landmark.LandmarkType);
    }

    [Fact]
    public void Parse_WayWithCenterCoordinates_UsesCenterAsLatLon()
    {
        // Arrange — ways/relations only carry a "center" point, not lat/lon directly.
        const string json = """
            {"elements":[{"type":"way","id":789,"center":{"lat":13.76,"lon":100.54},"tags":{"highway":"footway","bridge":"yes"}}]}
            """;

        // Act
        var result = OverpassLandmarkParser.Parse(json);

        // Assert
        var landmark = Assert.Single(result);
        Assert.Equal(13.76m, landmark.Latitude);
        Assert.Equal(100.54m, landmark.Longitude);
        Assert.Equal(LandmarkType.Skywalk, landmark.LandmarkType);
    }

    [Fact]
    public void Parse_UnmatchedTags_FallsBackToLandmarkWithDescription()
    {
        // Arrange — a tag combination that doesn't map to any specific LandmarkType.
        const string json = """
            {"elements":[{"type":"node","id":999,"lat":13.70,"lon":100.55,"tags":{"amenity":"restaurant","name":"Some Place"}}]}
            """;

        // Act
        var result = OverpassLandmarkParser.Parse(json);

        // Assert — never silently dropped for not fitting the enum (T08).
        var landmark = Assert.Single(result);
        Assert.Equal(LandmarkType.Landmark, landmark.LandmarkType);
        Assert.Equal("amenity=restaurant", landmark.Description);
    }

    [Fact]
    public void Parse_ElementWithNoCoordinates_IsSkipped()
    {
        // Arrange — no lat/lon and no center (shouldn't happen with "out center;", but
        // must not throw if it does).
        const string json = """{"elements":[{"type":"way","id":1,"tags":{"highway":"crossing"}}]}""";

        // Act
        var result = OverpassLandmarkParser.Parse(json);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void Parse_NoElementsProperty_ReturnsEmptyList()
    {
        // Arrange
        const string json = "{}";

        // Act
        var result = OverpassLandmarkParser.Parse(json);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void Parse_ThaiAndEnglishNameTags_MapToRespectiveFields()
    {
        // Arrange
        const string json = """
            {"elements":[{"type":"node","id":42,"lat":13.75,"lon":100.50,"tags":{"entrance":"yes","name:th":"ทางเข้า","name:en":"Entrance"}}]}
            """;

        // Act
        var result = OverpassLandmarkParser.Parse(json);

        // Assert
        var landmark = Assert.Single(result);
        Assert.Equal(LandmarkType.MallEntrance, landmark.LandmarkType);
        Assert.Equal("ทางเข้า", landmark.NameTh);
        Assert.Equal("Entrance", landmark.NameEn);
    }
}
