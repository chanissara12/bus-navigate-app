using BusNavigate.Domain.Helpers;

namespace BusNavigate.Service.Test.TravelOptionEvaluation;

public class GeoDistanceHelperTests
{
    [Fact]
    public void HaversineDistanceMeters_SamePoint_ReturnsZero()
    {
        // Arrange
        const decimal lat = 13.7563m;
        const decimal lon = 100.5018m;

        // Act
        var distance = GeoDistanceHelper.HaversineDistanceMeters(lat, lon, lat, lon);

        // Assert
        Assert.Equal(0, distance, precision: 3);
    }

    [Fact]
    public void HaversineDistanceMeters_OneDegreeLatitudeApart_IsApproximatelyOneHundredElevenKilometers()
    {
        // Arrange — 1 degree of latitude is ~111.19km everywhere on Earth, a
        // well-known reference value independent of this implementation.
        const decimal lat1 = 13.0m;
        const decimal lat2 = 14.0m;
        const decimal lon = 100.0m;

        // Act
        var distanceMeters = GeoDistanceHelper.HaversineDistanceMeters(lat1, lon, lat2, lon);

        // Assert
        Assert.InRange(distanceMeters, 110_000, 112_000);
    }

    [Fact]
    public void HaversineDistanceMeters_KnownNearbyBangkokPoints_MatchesExpectedOrderOfMagnitude()
    {
        // Arrange — Siam (13.7456, 100.5342) to Victory Monument (13.7649, 100.5372),
        // roughly 2.2km apart in a straight line.
        const decimal siamLat = 13.7456m;
        const decimal siamLon = 100.5342m;
        const decimal victoryMonumentLat = 13.7649m;
        const decimal victoryMonumentLon = 100.5372m;

        // Act
        var distanceMeters = GeoDistanceHelper.HaversineDistanceMeters(
            siamLat, siamLon, victoryMonumentLat, victoryMonumentLon);

        // Assert
        Assert.InRange(distanceMeters, 2_000, 2_400);
    }
}
